import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { createTotpSecret,encryptTotpSecret,totpUri } from "@/lib/auth/admin-mfa";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

export async function POST(request:Request){
 try{assertSameOrigin(request);const{session,admin}=await requireAdmin({requireRecentAuth:true});const secret=createTotpSecret(),encrypted=await encryptTotpSecret(secret),context=auditRequestContext(request);await prisma.$transaction(async tx=>{await tx.adminMfaRecoveryCode.deleteMany({where:{adminUserId:admin.id}});await tx.adminUser.update({where:{id:admin.id},data:{totpSecretEncrypted:encrypted,twoFactorVerifiedAt:null}});await tx.session.update({where:{id:session.id},data:{mfaVerifiedAt:null}});await appendAuditLog(tx,{adminUserId:admin.id,action:"ADMIN_MFA_ENROLLMENT_STARTED",targetType:"AdminUser",targetId:admin.id,...context})});return Response.json({secret,otpauthUri:totpUri(secret,session.user.email??session.user.username??session.user.phoneNumber??session.user.id)})}
 catch(error){const message=error instanceof Error?error.message:"";const status=message==="REAUTH_REQUIRED"?403:message==="ADMIN_MFA_NOT_CONFIGURED"?503:401;return Response.json({error:message||"MFA_ENROLLMENT_FAILED"},{status})}
}
