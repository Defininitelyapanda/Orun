import { z } from "zod";
import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit,assertSameOrigin } from "@/lib/security/request-guards";

const inputSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("REVOKE_SESSIONS"),reason:z.string().trim().min(5).max(500)}),
 z.object({action:z.enum(["SUSPEND","REACTIVATE"]),reason:z.string().trim().min(10).max(500)}),
]);

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  assertSameOrigin(request);const input=inputSchema.parse(await request.json()),permission=input.action==="REVOKE_SESSIONS"?"users:sessions:write":"users:status:write",{session,admin}=await requireAdmin({permission,requireMfa:true,requireRecentAuth:true});assertRateLimit(`admin-user-action:${admin.id}`,20,10*60_000);const{id}=await params;if(id===session.userId&&input.action==="SUSPEND")return Response.json({error:"SELF_SUSPENSION_FORBIDDEN"},{status:409});const user=await prisma.user.findUnique({where:{id},select:{id:true,status:true,email:true}});if(!user)return Response.json({error:"USER_NOT_FOUND"},{status:404});const context=auditRequestContext(request);
  await prisma.$transaction(async tx=>{if(input.action==="REVOKE_SESSIONS")await tx.session.updateMany({where:{userId:id,revokedAt:null},data:{revokedAt:new Date()}});else await tx.user.update({where:{id},data:{status:input.action==="SUSPEND"?"SUSPENDED":"ACTIVE"}});await appendAuditLog(tx,{adminUserId:admin.id,action:`USER_${input.action}`,targetType:"User",targetId:id,reason:input.reason,before:{status:user.status},after:{status:input.action==="SUSPEND"?"SUSPENDED":input.action==="REACTIVATE"?"ACTIVE":user.status},metadata:{targetEmail:user.email},...context})});return Response.json({ok:true})
 }catch(error){const message=error instanceof Error?error.message:"";const status=message==="AUTH_REQUIRED"?401:message==="NOT_AUTHORIZED"?403:message==="MFA_REQUIRED"||message==="REAUTH_REQUIRED"?428:message==="RATE_LIMITED"?429:400;return Response.json({error:message||"USER_ACTION_FAILED"},{status})}
}
