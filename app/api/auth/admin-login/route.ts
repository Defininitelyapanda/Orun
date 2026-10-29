import { NextResponse } from "next/server";
import { z } from "zod";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin, requestRateLimitKey } from "@/lib/security/request-guards";
import { AuthService } from "@/server/services/auth-service";

export const runtime = "nodejs";
const schema = z.object({ code: z.string().trim().regex(/^\d{4,12}$/), password: z.string().min(1).max(200), next: z.string().optional() });
const safeNext = (value?: string) => value?.startsWith("/admin") || value === "/auth/admin-mfa" ? value : "/admin";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertRateLimit(await requestRateLimitKey(request, "admin-login"), 6, 15 * 60_000);
    const data = schema.parse(Object.fromEntries(await request.formData()));
    const result = await new AuthService(prisma, new Pbkdf2PasswordHasher()).authenticate(data.code, data.password, {
      remember: false,
      requireAdmin: true,
      ipHash: await requestRateLimitKey(request, "ip"),
      userAgent: request.headers.get("user-agent")?.slice(0, 500),
    });
    const response = NextResponse.redirect(new URL(safeNext(data.next), request.url), 303);
    response.cookies.set("orun_session", result.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", priority: "high" });
    return response;
  } catch (error) {
    const reason = error instanceof Error && error.message === "RATE_LIMITED" ? "rate-limit" : "credentials";
    return NextResponse.redirect(new URL(`/auth/admin-login?error=${reason}`, request.url), 303);
  }
}
