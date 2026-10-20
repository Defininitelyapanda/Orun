import { prisma } from "@/lib/db/prisma";
import { currentAuthSession } from "./session-cookie";
export async function requireAdmin(permission?: string) {
  const session = await currentAuthSession();
  if (!session) throw new Error("AUTH_REQUIRED");
  const admin = await prisma.adminUser.findUnique({ where: { userId: session.user.id }, include: { roles: { include: { role: true } } } });
  if (!admin?.active) throw new Error("NOT_AUTHORIZED");
  if (permission && !admin.roles.some(item => item.role.name === "SUPER_ADMIN" || item.role.permissions.includes(permission))) throw new Error("NOT_AUTHORIZED");
  return { session, admin };
}
