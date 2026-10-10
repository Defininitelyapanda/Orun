import { prisma } from "@/lib/db/prisma";
import { requestIdentity } from "@/server/services/request-identity-service";

export async function GET(request: Request) {
  const user = await requestIdentity(request);
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const profiles = await prisma.profile.findMany({ where: { userId: user.id }, select: { id: true, name: true, isKids: true }, orderBy: { createdAt: "asc" } });
  return Response.json({ user, profiles }, { headers: { "cache-control": "no-store" } });
}
