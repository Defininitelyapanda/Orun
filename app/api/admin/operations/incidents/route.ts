import { z } from "zod";
import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";
const schema=z.object({title:z.string().trim().min(3).max(300),summary:z.string().trim().min(10).max(4000),severity:z.enum(["INFO","LOW","MEDIUM","HIGH","CRITICAL"])});
export async function POST(request:Request){try{assertSameOrigin(request);const{admin}=await requireAdmin({permission:"incidents:write",requireMfa:true,requireRecentAuth:true}),input=schema.parse(await request.json()),incident=await prisma.incident.create({data:{...input,commanderAdminId:admin.id}});await appendAuditLog(prisma,{adminUserId:admin.id,action:"INCIDENT_OPENED",targetType:"Incident",targetId:incident.id,after:incident,...auditRequestContext(request)});return Response.json({incident},{status:201})}catch(error){const message=error instanceof Error?error.message:"INCIDENT_CREATE_FAILED";return Response.json({error:message},{status:["MFA_REQUIRED","REAUTH_REQUIRED"].includes(message)?428:message==="NOT_AUTHORIZED"?403:400})}}
