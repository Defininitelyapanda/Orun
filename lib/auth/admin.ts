import { prisma } from "@/lib/db/prisma";
import { currentAuthSession } from "./session-cookie";
import { roleAllows } from "./permissions";
type AdminRequirement={permission?:string;requireMfa?:boolean;requireRecentAuth?:boolean};
export async function requireAdmin(requirement?: string|AdminRequirement) {
  const options=typeof requirement==="string"?{permission:requirement}:requirement??{};
  const session = await currentAuthSession();
  if (!session) throw new Error("AUTH_REQUIRED");
  const admin = await prisma.adminUser.findUnique({ where: { userId: session.user.id }, include: { roles: { include: { role: true } } } });
  if (!admin?.active) throw new Error("NOT_AUTHORIZED");
  if (options.permission && !admin.roles.some(item => roleAllows(item.role.name,options.permission!) || item.role.permissions.includes(options.permission!))) throw new Error("NOT_AUTHORIZED");
  if(options.requireMfa&&!admin.twoFactorVerifiedAt)throw new Error("MFA_REQUIRED");
  if(options.requireRecentAuth&&(!admin.lastSensitiveAuthAt||admin.lastSensitiveAuthAt<new Date(Date.now()-15*60_000)))throw new Error("REAUTH_REQUIRED");
  return { session, admin };
}
