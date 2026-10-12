import { currentAuthSession } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const current = await currentAuthSession();
    if (!current) return Response.json({ error: "Authentication required" }, { status: 401 });
    const { id } = await params;
    if (id === current.id) return Response.json({ error: "Use sign out to end the current session" }, { status: 409 });
    const result = await prisma.session.updateMany({
      where: { id, userId: current.userId, revokedAt: null }, data: { revokedAt: new Date() },
    });
    if (!result.count) return Response.json({ error: "Session not found" }, { status: 404 });
    await prisma.securityEvent.create({ data: { userId: current.userId, type: "SESSION_REVOKED", summary: "A session was signed out" } });
    return Response.json({ revoked: true });
  } catch {
    return Response.json({ error: "Session could not be revoked" }, { status: 400 });
  }
}
