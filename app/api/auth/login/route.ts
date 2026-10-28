import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { AuthService } from "@/server/services/auth-service";
import { assertRateLimit, assertSameOrigin, requestRateLimitKey } from "@/lib/security/request-guards";

export const runtime = "nodejs";
const schema = z.object({ identifier: z.string().trim().min(3).max(320), password: z.string().min(1).max(200), remember: z.string().optional(), next: z.string().optional() });
const safeNext = (value?: string) => value?.startsWith("/") && !value.startsWith("//") ? value : "/profile";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const rateKey = await requestRateLimitKey(request, "login");
    assertRateLimit(rateKey, 8, 15 * 60_000);
    const data = schema.parse(Object.fromEntries(await request.formData()));
    const ipHash = await requestRateLimitKey(request, "ip");
    const result = await new AuthService(prisma, new Pbkdf2PasswordHasher()).authenticate(data.identifier, data.password, { remember: data.remember === "on", ipHash, userAgent: request.headers.get("user-agent")?.slice(0, 500) });
    const response = NextResponse.redirect(new URL(safeNext(data.next), request.url), 303);
    response.cookies.set("orun_session", result.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", ...(result.remembered ? { maxAge: 30 * 24 * 3600 } : {}), priority: "high" });
    return response;
  } catch (error) {
    const reason = error instanceof Error && error.message === "RATE_LIMITED" ? "rate-limit" : "credentials";
    return NextResponse.redirect(new URL(`/auth/login?error=${reason}`, request.url), 303);
  }
}
