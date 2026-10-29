import { randomInt } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import type { PasswordHasher } from "@/lib/auth/passwords";
import { normalizeIdentifier, type IdentifierKind } from "@/lib/auth/identifiers";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { createOpaqueToken, hashToken, hashVerificationCode } from "@/lib/auth/tokens";

const REMEMBERED_SESSION_MS = 30 * 24 * 60 * 60_000;
const BROWSER_SESSION_MS = 12 * 60 * 60_000;
const LOCK_THRESHOLD = 5;

export function sessionLifetimeMs(remember: boolean) {
  return remember ? REMEMBERED_SESSION_MS : BROWSER_SESSION_MS;
}

type AuthenticationOptions = { remember: boolean; ipHash?: string; userAgent?: string; requireAdmin?: boolean; forbidAdmin?: boolean };

export class AuthService {
  constructor(private db: PrismaClient, private passwords: PasswordHasher) {}

  async register(input: { name?: string; identifier: string; identifierType: IdentifierKind; password: string }) {
    if (input.password.length < MIN_PASSWORD_LENGTH) throw new Error("PASSWORD_TOO_SHORT");
    const { kind, normalized } = normalizeIdentifier(input.identifier, input.identifierType);
    const existing = await this.db.user.findFirst({ where: { OR: [{ email: normalized }, { phoneNumber: normalized }, { username: normalized }] }, select: { id: true } });
    if (existing) throw new Error("IDENTIFIER_IN_USE");
    const name = input.name?.trim() || (kind === "email" ? normalized.split("@")[0] : kind === "phone" ? `Member ${normalized.slice(-4)}` : normalized);
    const passwordHash = await this.passwords.hash(input.password);
    const code = kind === "username" ? null : String(randomInt(100_000, 1_000_000));
    const user = await this.db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email: kind === "email" ? normalized : null,
          phoneNumber: kind === "phone" ? normalized : null,
          username: kind === "username" ? normalized : null,
          passwordHash,
          status: kind === "username" ? "ACTIVE" : "PENDING",
          profiles: { create: { name: name.split(" ")[0] || "Profile" } },
        },
        select: { id: true, email: true, phoneNumber: true, username: true, name: true, status: true },
      });
      if (code) await tx.verificationChallenge.create({ data: { userId: created.id, kind: kind.toUpperCase(), target: normalized, codeHash: hashVerificationCode(code), expiresAt: new Date(Date.now() + 10 * 60_000) } });
      await tx.securityEvent.create({ data: { userId: created.id, type: "ACCOUNT_REGISTERED", summary: `Account registered with ${kind}` } });
      return created;
    });
    return { user, verification: code ? { kind, target: normalized, code } : null };
  }

  async authenticate(identifier: string, password: string, options: AuthenticationOptions = { remember: false }) {
    const { normalized } = normalizeIdentifier(identifier);
    const user = await this.db.user.findFirst({ where: { OR: [{ email: normalized }, { phoneNumber: normalized }, { username: normalized }] } });
    if (!user) {
      await this.passwords.hash(password);
      throw new Error("INVALID_CREDENTIALS");
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new Error("INVALID_CREDENTIALS");
    const admin = options.requireAdmin || options.forbidAdmin ? await this.db.adminUser.findUnique({ where: { userId: user.id }, select: { active: true } }) : null;
    const valid = await this.passwords.verify(user.passwordHash, password);
    const allowedAudience = options.requireAdmin ? admin?.active === true : options.forbidAdmin ? admin === null : true;
    if (!valid || user.status !== "ACTIVE" || !allowedAudience) {
      const failures = user.failedLoginAttempts + 1;
      const lockedUntil = failures >= LOCK_THRESHOLD ? new Date(Date.now() + Math.min(60, 2 ** (failures - LOCK_THRESHOLD) * 5) * 60_000) : null;
      await this.db.$transaction([
        this.db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: failures, lockedUntil } }),
        this.db.securityEvent.create({ data: { userId: user.id, type: "LOGIN_FAILED", summary: lockedUntil ? "Login rejected; temporary lock applied" : "Login rejected", ipHash: options.ipHash, userAgent: options.userAgent } }),
      ]);
      throw new Error("INVALID_CREDENTIALS");
    }
    const { token, hash } = createOpaqueToken();
    const expiresAt = new Date(Date.now() + sessionLifetimeMs(options.remember));
    await this.db.$transaction([
      this.db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } }),
      this.db.session.create({ data: { userId: user.id, tokenHash: hash, expiresAt, remembered: options.remember, ipHash: options.ipHash, userAgent: options.userAgent } }),
      this.db.securityEvent.create({ data: { userId: user.id, type: "LOGIN_SUCCEEDED", summary: options.remember ? "Remembered session created" : "Browser session created", ipHash: options.ipHash, userAgent: options.userAgent } }),
    ]);
    return { user: { id: user.id, email: user.email, phoneNumber: user.phoneNumber, username: user.username, name: user.name }, token, expiresAt, remembered: options.remember };
  }

  async verifyIdentifier(identifier: string, code: string) {
    const { kind, normalized } = normalizeIdentifier(identifier);
    if (kind === "username") throw new Error("VERIFICATION_NOT_REQUIRED");
    const user = await this.db.user.findFirst({ where: { OR: [{ email: normalized }, { phoneNumber: normalized }] } });
    if (!user) throw new Error("INVALID_CODE");
    const challenge = await this.db.verificationChallenge.findFirst({ where: { userId: user.id, kind: kind.toUpperCase(), target: normalized, usedAt: null }, orderBy: { createdAt: "desc" } });
    if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 5 || challenge.codeHash !== hashVerificationCode(code.trim())) {
      if (challenge) await this.db.verificationChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
      throw new Error("INVALID_CODE");
    }
    const now = new Date();
    await this.db.$transaction([
      this.db.verificationChallenge.update({ where: { id: challenge.id }, data: { usedAt: now } }),
      this.db.user.update({ where: { id: user.id }, data: { status: "ACTIVE", ...(kind === "email" ? { emailVerifiedAt: now } : { phoneVerifiedAt: now }) } }),
      this.db.securityEvent.create({ data: { userId: user.id, type: `${kind.toUpperCase()}_VERIFIED`, summary: `${kind} identifier verified` } }),
    ]);
  }

  async createReset(identifier: string) {
    const { normalized } = normalizeIdentifier(identifier);
    const user = await this.db.user.findFirst({ where: { OR: [{ email: normalized }, { phoneNumber: normalized }, { username: normalized }] } });
    if (!user?.email || !user.emailVerifiedAt) return null;
    const { token, hash } = createOpaqueToken();
    await this.db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 30 * 60_000) } });
    return { token, email: user.email };
  }

  async resetPassword(token: string, password: string) {
    if (password.length < MIN_PASSWORD_LENGTH) throw new Error("PASSWORD_TOO_SHORT");
    const record = await this.db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw new Error("RESET_INVALID");
    const passwordHash = await this.passwords.hash(password);
    const now = new Date();
    await this.db.$transaction([
      this.db.user.update({ where: { id: record.userId }, data: { passwordHash, passwordChangedAt: now, failedLoginAttempts: 0, lockedUntil: null } }),
      this.db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: now } }),
      this.db.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: now } }),
      this.db.securityEvent.create({ data: { userId: record.userId, type: "PASSWORD_RESET", summary: "Password reset completed; sessions revoked" } }),
    ]);
  }
}
