import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db/prisma";
import { canManageP2P } from "@/lib/p2p/policy";
import { readP2PFeatureFlags } from "@/lib/p2p/flags";

function cookieValue(request: Request, name: string) {
  const match = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export async function requestIdentity(request: Request) {
  const token = cookieValue(request, "orun_session");
  if (token) {
    const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
    if (session && !session.revokedAt && session.expiresAt > new Date() && session.user.status === "ACTIVE") return { id: session.user.id, name: session.user.name, email: session.user.email };
  }
  if (process.env.NODE_ENV === "development" && process.env.DEMO_MODE === "true") {
    const id = request.headers.get("x-orun-user-id");
    if (id) return prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
  }
  return null;
}

export async function requireP2PAdmin(request: Request) {
  if (!readP2PFeatureFlags().adminEnabled) return null;
  const user = await requestIdentity(request);
  if (!user) return null;
  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id }, include: { roles: { include: { role: true } } } });
  if (!admin?.active) return null;
  const names = admin.roles.map(({ role }) => role.name);
  const permissions = admin.roles.flatMap(({ role }) => role.permissions);
  return canManageP2P(names, permissions) ? { user, admin, names, permissions } : null;
}
