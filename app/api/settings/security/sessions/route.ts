import { currentAuthSession } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

export async function GET() {
  const current = await currentAuthSession();
  if (!current) return Response.json({ error: "Authentication required" }, { status: 401 });
  const sessions = await prisma.session.findMany({
    where: { userId: current.userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, lastSeenAt: true, expiresAt: true, userAgent: true },
  });
  return Response.json(sessions.map((session) => ({ ...session, current: session.id === current.id })), { headers: { "cache-control": "no-store" } });
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const current = await currentAuthSession();
    if (!current) return Response.json({ error: "Authentication required" }, { status: 401 });
    const result = await prisma.session.updateMany({
      where: { userId: current.userId, id: { not: current.id }, revokedAt: null }, data: { revokedAt: new Date() },
    });
    await prisma.securityEvent.create({ data: { userId: current.userId, type: "SESSIONS_REVOKED", summary: `${result.count} other sessions signed out` } });
    return Response.json({ revoked: result.count });
  } catch {
    return Response.json({ error: "Sessions could not be revoked" }, { status: 400 });
  }
}
