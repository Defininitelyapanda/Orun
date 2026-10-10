import { prisma } from "@/lib/db/prisma";
import { requestIdentity } from "@/server/services/request-identity-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requestIdentity(request);
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const session = await prisma.p2PPlaybackSession.findFirst({ where: { id, userId: user.id } });
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.p2PPlaybackSession.update({ where: { id }, data: { status: "CANCELLED", failureCategory: "USER_CANCELLED", endedAt: new Date() } }),
    prisma.p2PPlaybackEvent.create({ data: { sessionId: id, type: "CANCELLED", failureCategory: "USER_CANCELLED" } }),
  ]);
  return Response.json({ cancelled: true });
}
