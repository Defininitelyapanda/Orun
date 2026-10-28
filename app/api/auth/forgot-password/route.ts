import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { sendPasswordReset } from "@/lib/auth/delivery";
import { AuthService } from "@/server/services/auth-service";
import { assertRateLimit, assertSameOrigin, requestRateLimitKey } from "@/lib/security/request-guards";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertRateLimit(await requestRateLimitKey(request, "password-reset"), 4, 60 * 60_000);
    const { identifier } = z.object({ identifier: z.string().trim().min(3).max(320) }).parse(Object.fromEntries(await request.formData()));
    const reset = await new AuthService(prisma, new Pbkdf2PasswordHasher()).createReset(identifier);
    if (reset) await sendPasswordReset(reset.email, reset.token, new URL(request.url).origin).catch(() => false);
  } catch { /* Anti-enumeration: every outcome returns the same redirect. */ }
  return NextResponse.redirect(new URL("/auth/login?reset=sent", request.url), 303);
}
