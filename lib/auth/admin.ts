import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { currentAuthSession } from "./session-cookie";
import { roleAllows } from "./permissions";
import { FALLBACK_ADMIN_COOKIE, fallbackAdminAccess, verifyFallbackAdminSession } from "./admin-fallback";
import type { AdminRoleName } from "@/generated/prisma/client";
type AdminRequirement={permission?:string;requireMfa?:boolean;requireRecentAuth?:boolean};
type AdminAccess={session:{id:string;userId:string;mfaVerifiedAt:Date|null;user:{id:string;name:string;email:string|null;username:string|null;phoneNumber:string|null;passwordHash:string}};admin:{id:string;userId:string;active:boolean;totpSecretEncrypted:string|null;twoFactorVerifiedAt:Date|null;lastSensitiveAuthAt:Date|null;roles:{role:{name:AdminRoleName;permissions:string[]}}[]}};
export function hasFreshAdminMfa(value:Date|null|undefined,now=new Date()){return Boolean(value&&value>=new Date(now.getTime()-12*60*60_000))}
export async function requireAdmin(requirement?: string|AdminRequirement):Promise<AdminAccess> {
  const options=typeof requirement==="string"?{permission:requirement}:requirement??{};
  const fallbackToken=(await cookies()).get(FALLBACK_ADMIN_COOKIE)?.value;
  const fallbackPayload=fallbackToken?verifyFallbackAdminSession(fallbackToken):null;
  if(fallbackPayload){
    const access=fallbackAdminAccess(fallbackPayload);
    if(options.permission&&!access.admin.roles.some(item=>roleAllows(item.role.name,options.permission!)||item.role.permissions.includes(options.permission!)))throw new Error("NOT_AUTHORIZED");
    if(options.requireMfa&&!hasFreshAdminMfa(access.session.mfaVerifiedAt))throw new Error("MFA_REQUIRED");
    if(options.requireRecentAuth&&access.admin.lastSensitiveAuthAt<new Date(Date.now()-15*60_000))throw new Error("REAUTH_REQUIRED");
    return access;
  }
  const session = await currentAuthSession();
  if (!session) throw new Error("AUTH_REQUIRED");
  const admin = await prisma.adminUser.findUnique({ where: { userId: session.user.id }, include: { roles: { include: { role: true } } } });
  if (!admin?.active) throw new Error("NOT_AUTHORIZED");
  if (options.permission && !admin.roles.some(item => roleAllows(item.role.name,options.permission!) || item.role.permissions.includes(options.permission!))) throw new Error("NOT_AUTHORIZED");
  if(options.requireMfa&&(!admin.twoFactorVerifiedAt||!hasFreshAdminMfa(session.mfaVerifiedAt)))throw new Error("MFA_REQUIRED");
  if(options.requireRecentAuth&&(!admin.lastSensitiveAuthAt||admin.lastSensitiveAuthAt<new Date(Date.now()-15*60_000)))throw new Error("REAUTH_REQUIRED");
  return { session, admin };
}

export async function requireOwner() {
  const access = await requireAdmin();
  if (!access.admin.roles.some(item => item.role.name === "OWNER")) throw new Error("OWNER_REQUIRED");
  return access;
}
