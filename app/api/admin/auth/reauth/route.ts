import { z } from "zod";
import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { Pbkdf2PasswordHasher } from "@/lib/auth/passwords";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit,assertSameOrigin } from "@/lib/security/request-guards";

export async function POST(request:Request){
 try{assertSameOrigin(request);const{session,admin}=await requireAdmin();assertRateLimit(`admin-reauth:${admin.id}`,5,15*60_000);const{password}=z.object({password:z.string().min(1).max(200)}).parse(await request.json());const valid=await new Pbkdf2PasswordHasher().verify(session.user.passwordHash,password);if(!valid)throw new Error("INVALID_CREDENTIALS");const context=auditRequestContext(request);await prisma.$transaction(async tx=>{await tx.adminUser.update({where:{id:admin.id},data:{lastSensitiveAuthAt:new Date()}});await appendAuditLog(tx,{adminUserId:admin.id,action:"ADMIN_REAUTHENTICATED",targetType:"AdminUser",targetId:admin.id,...context})});return Response.json({ok:true,validForSeconds:900})}
 catch(error){if(error instanceof Error&&error.message==="RATE_LIMITED")return Response.json({error:"RATE_LIMITED"},{status:429});return Response.json({error:"REAUTHENTICATION_FAILED"},{status:401})}
}
