import { z } from "zod";
import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { createRecoveryCodes,decryptTotpSecret,hashRecoveryCode,verifyTotp } from "@/lib/auth/admin-mfa";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit,assertSameOrigin } from "@/lib/security/request-guards";

export async function POST(request:Request){
 try{assertSameOrigin(request);const{session,admin}=await requireAdmin({requireRecentAuth:true});assertRateLimit(`admin-mfa-confirm:${admin.id}`,8,10*60_000);const{code}=z.object({code:z.string().regex(/^\d{6}$/)}).parse(await request.json());if(!admin.totpSecretEncrypted||!await verifyTotp(await decryptTotpSecret(admin.totpSecretEncrypted),code))throw new Error("INVALID_MFA_CODE");const codes=createRecoveryCodes(),hashes=await Promise.all(codes.map(hashRecoveryCode)),context=auditRequestContext(request),now=new Date();await prisma.$transaction(async tx=>{await tx.adminUser.update({where:{id:admin.id},data:{twoFactorVerifiedAt:now}});await tx.session.update({where:{id:session.id},data:{mfaVerifiedAt:now}});await tx.adminMfaRecoveryCode.deleteMany({where:{adminUserId:admin.id}});await tx.adminMfaRecoveryCode.createMany({data:hashes.map(codeHash=>({adminUserId:admin.id,codeHash}))});await appendAuditLog(tx,{adminUserId:admin.id,action:"ADMIN_MFA_ENABLED",targetType:"AdminUser",targetId:admin.id,...context})});return Response.json({ok:true,recoveryCodes:codes})}
 catch(error){if(error instanceof Error&&error.message==="RATE_LIMITED")return Response.json({error:"RATE_LIMITED"},{status:429});return Response.json({error:"MFA_CONFIRMATION_FAILED"},{status:400})}
}
