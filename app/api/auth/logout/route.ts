import { NextResponse } from "next/server";
import { currentAuthSession } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { FALLBACK_ADMIN_COOKIE } from "@/lib/auth/admin-fallback";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await currentAuthSession();
    if (session) await prisma.$transaction([
      prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
      prisma.securityEvent.create({ data: { userId: session.userId, type: "LOGOUT", summary: "Current session signed out" } }),
    ]);
  } catch { /* Cookie removal still completes locally. */ }
  const response = NextResponse.redirect(new URL("/auth/login?signedOut=1", request.url), 303);
  response.cookies.set("orun_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(FALLBACK_ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
