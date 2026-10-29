import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { identifierKindSchema } from "@/lib/auth/identifiers";
import { sendVerificationCode } from "@/lib/auth/delivery";
import { AuthService } from "@/server/services/auth-service";
import { assertRateLimit, assertSameOrigin, requestRateLimitKey } from "@/lib/security/request-guards";

export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().max(80).optional(), identifierType: identifierKindSchema, identifier: z.string().trim().min(3).max(320), password: z.string().min(MIN_PASSWORD_LENGTH).max(200), passwordConfirmation: z.string().min(MIN_PASSWORD_LENGTH).max(200) });

function redirect(request: Request, path: string) { return NextResponse.redirect(new URL(path, request.url), 303); }

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertRateLimit(await requestRateLimitKey(request, "register"), 4, 60 * 60_000);
    const data = schema.parse(Object.fromEntries(await request.formData()));
    if (data.password !== data.passwordConfirmation) return redirect(request, "/auth/register?error=password-mismatch");
    const registration = await prisma.platformSetting.findUnique({ where: { key: "auth.publicRegistration" } });
    if (registration?.value === false) return redirect(request, "/auth/register?error=unavailable");
    const result = await new AuthService(prisma, new Pbkdf2PasswordHasher()).register(data);
    if (!result.verification) return redirect(request, "/auth/login?registered=1");
    if (result.verification.kind === "username") return redirect(request, "/auth/login?registered=1");
    const delivered = await sendVerificationCode(result.verification.kind, result.verification.target, result.verification.code).catch(() => false);
    return redirect(request, `/auth/verify?channel=${result.verification.kind}&delivery=${delivered ? "sent" : "unavailable"}`);
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") return redirect(request, "/auth/register?error=rate-limit");
    if (error instanceof Error && error.message === "IDENTIFIER_IN_USE") return redirect(request, "/auth/register?error=identifier-in-use");
    if (error instanceof z.ZodError) return redirect(request, "/auth/register?error=invalid");
    return redirect(request, "/auth/register?error=unavailable");
  }
}
