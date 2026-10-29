import { z } from "zod";
import { currentAuthSession } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";

const inputSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(MIN_PASSWORD_LENGTH).max(200), newPasswordConfirmation: z.string().min(MIN_PASSWORD_LENGTH).max(200) }).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const current = await currentAuthSession();
    if (!current) return Response.json({ error: "Authentication required" }, { status: 401 });
    assertRateLimit(`password:${current.userId}`, 5, 15 * 60_000);
    const input = inputSchema.parse(await request.json());
    if (input.newPassword !== input.newPasswordConfirmation) return Response.json({ error: "New passwords do not match" }, { status: 422 });
    const passwords = new Pbkdf2PasswordHasher();
    if (!await passwords.verify(current.user.passwordHash, input.currentPassword)) return Response.json({ error: "Current password is incorrect" }, { status: 403 });
    const passwordHash = await passwords.hash(input.newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: current.userId }, data: { passwordHash, passwordChangedAt: new Date(), failedLoginAttempts: 0, lockedUntil: null } }),
      prisma.session.updateMany({ where: { userId: current.userId, id: { not: current.id }, revokedAt: null }, data: { revokedAt: new Date() } }),
      prisma.securityEvent.create({ data: { userId: current.userId, type: "PASSWORD_CHANGED", summary: "Password changed and other sessions revoked" } }),
    ]);
    return Response.json({ changed: true });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    return Response.json({ error: "Password could not be changed" }, { status: 422 });
  }
}
