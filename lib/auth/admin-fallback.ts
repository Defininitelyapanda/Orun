import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { AdminRoleName } from "@/generated/prisma/client";
import { Pbkdf2PasswordHasher } from "./passwords";

export const FALLBACK_ADMIN_COOKIE = "orun_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60_000;

type SessionPayload = { version: 1; issuedAt: number; expiresAt: number };
type AdminRuntimeEnv = Partial<Record<"AUTH_SECRET" | "ORUN_ADMIN_CODE" | "ORUN_ADMIN_PASSWORD_HASH" | "ORUN_ADMIN_NAME", string>>;

const workerEnv: AdminRuntimeEnv = await import("cloudflare:workers")
  .then(({ env }) => env as AdminRuntimeEnv)
  .catch(() => ({}));

function runtimeValue(name: keyof AdminRuntimeEnv) {
  return workerEnv[name] ?? process.env[name];
}

function secureTextEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function signingSecret() {
  const secret = runtimeValue("AUTH_SECRET");
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET_REQUIRED");
  return secret;
}

function signature(value: string) {
  return createHmac("sha256", signingSecret()).update(value).digest("base64url");
}

export function fallbackAdminConfigured() {
  return Boolean(runtimeValue("ORUN_ADMIN_CODE") && runtimeValue("ORUN_ADMIN_PASSWORD_HASH") && runtimeValue("AUTH_SECRET"));
}

export async function verifyFallbackAdminCredentials(code: string, password: string) {
  const configuredCode = runtimeValue("ORUN_ADMIN_CODE") ?? "";
  const passwordHash = runtimeValue("ORUN_ADMIN_PASSWORD_HASH") ?? "";
  if (!configuredCode || !passwordHash) return false;
  const codeValid = secureTextEqual(code, configuredCode);
  const passwordValid = await new Pbkdf2PasswordHasher().verify(passwordHash, password).catch(() => false);
  return codeValid && passwordValid;
}

export function createFallbackAdminSession(now = Date.now()) {
  const payload: SessionPayload = { version: 1, issuedAt: now, expiresAt: now + SESSION_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${encoded}.${signature(encoded)}`, payload };
}

export function verifyFallbackAdminSession(token: string, now = Date.now()) {
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!encoded || !suppliedSignature || extra) return null;
  const expectedSignature = signature(encoded);
  if (!secureTextEqual(suppliedSignature, expectedSignature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (payload.version !== 1 || !Number.isFinite(payload.issuedAt) || !Number.isFinite(payload.expiresAt) || payload.issuedAt > now + 60_000 || payload.expiresAt <= now || payload.expiresAt - payload.issuedAt !== SESSION_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function fallbackAdminAccess(payload: SessionPayload) {
  const issuedAt = new Date(payload.issuedAt);
  return {
    session: {
      id: "cloudflare-owner-session",
      userId: "cloudflare-owner",
      mfaVerifiedAt: issuedAt,
      user: { id: "cloudflare-owner", name: runtimeValue("ORUN_ADMIN_NAME")?.trim() || "ORUN Owner", email: null, username: null, phoneNumber: null, passwordHash: runtimeValue("ORUN_ADMIN_PASSWORD_HASH") ?? "" },
    },
    admin: {
      id: "cloudflare-owner",
      userId: "cloudflare-owner",
      active: true,
      totpSecretEncrypted: null,
      twoFactorVerifiedAt: issuedAt,
      lastSensitiveAuthAt: issuedAt,
      roles: [{ role: { name: "OWNER" as AdminRoleName, permissions: ["*"] } }],
    },
  };
}
