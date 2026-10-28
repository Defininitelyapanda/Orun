import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { AuthService } from "@/server/services/auth-service";
import { assertRateLimit, assertSameOrigin, requestRateLimitKey } from "@/lib/security/request-guards";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertRateLimit(await requestRateLimitKey(request, "password-reset-complete"), 6, 15 * 60_000);
    const data = z.object({ token: z.string().min(20).max(500), password: z.string().min(12).max(200), passwordConfirmation: z.string().min(12).max(200) }).parse(Object.fromEntries(await request.formData()));
    if (data.password !== data.passwordConfirmation) return NextResponse.redirect(new URL(`/auth/reset-password?token=${encodeURIComponent(data.token)}&error=password-mismatch`, request.url), 303);
    await new AuthService(prisma, new Pbkdf2PasswordHasher()).resetPassword(data.token, data.password);
    return NextResponse.redirect(new URL("/auth/login?password=reset", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/auth/reset-password?error=invalid", request.url), 303);
  }
}
