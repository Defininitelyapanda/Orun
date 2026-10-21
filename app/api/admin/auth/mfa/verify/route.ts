import { z } from "zod";
import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { decryptTotpSecret,hashRecoveryCode,verifyTotp } from "@/lib/auth/admin-mfa";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit,assertSameOrigin } from "@/lib/security/request-guards";

export async function POST(request:Request){
 try{assertSameOrigin(request);const{session,admin}=await requireAdmin();assertRateLimit(`admin-mfa:${admin.id}`,8,10*60_000);const{code}=z.object({code:z.string().trim().min(6).max(19)}).parse(await request.json());let recoveryId:string|undefined,valid=false;if(/^\d{6}$/.test(code)&&admin.totpSecretEncrypted)valid=await verifyTotp(await decryptTotpSecret(admin.totpSecretEncrypted),code);else{const recovery=await prisma.adminMfaRecoveryCode.findUnique({where:{codeHash:await hashRecoveryCode(code)}});if(recovery&&recovery.adminUserId===admin.id&&!recovery.usedAt){valid=true;recoveryId=recovery.id}}if(!valid)throw new Error("INVALID_MFA_CODE");const context=auditRequestContext(request),now=new Date();await prisma.$transaction(async tx=>{await tx.session.update({where:{id:session.id},data:{mfaVerifiedAt:now}});if(recoveryId)await tx.adminMfaRecoveryCode.update({where:{id:recoveryId},data:{usedAt:now}});await appendAuditLog(tx,{adminUserId:admin.id,action:recoveryId?"ADMIN_MFA_RECOVERY_USED":"ADMIN_MFA_VERIFIED",targetType:"Session",targetId:session.id,...context})});return Response.json({ok:true})}
 catch(error){if(error instanceof Error&&error.message==="RATE_LIMITED")return Response.json({error:"RATE_LIMITED"},{status:429});return Response.json({error:"MFA_VERIFICATION_FAILED"},{status:401})}
}
