import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { inspectEnvironment } from "@/lib/config/environment";
import { prisma } from "@/lib/db/prisma";
import { evaluateLaunchReadiness } from "@/lib/release/readiness";
import { assertSameOrigin } from "@/lib/security/request-guards";
const schema=z.object({releaseVersion:z.string().trim().min(3).max(120),environment:z.string().trim().min(2).max(80),reason:z.string().trim().min(10).max(2000)});
export async function POST(request:Request){try{assertSameOrigin(request);const{admin}=await requireAdmin({permission:"readiness:write",requireMfa:true,requireRecentAuth:true}),input=schema.parse(await request.json()),records=await prisma.readinessEvidence.findMany({where:{environment:input.environment},orderBy:{performedAt:"desc"}}),readiness=evaluateLaunchReadiness(inspectEnvironment().capabilities,records),decision=readiness.ready?"APPROVED":"BLOCKED",context=auditRequestContext(request),record=await prisma.$transaction(async tx=>{const created=await tx.launchDecisionRecord.create({data:{...input,decision,readinessSnapshot:readiness as unknown as Prisma.InputJsonValue,decidedByAdminId:admin.id}});await appendAuditLog(tx,{adminUserId:admin.id,action:`LAUNCH_${decision}`,targetType:"LaunchDecisionRecord",targetId:created.id,reason:input.reason,after:{releaseVersion:input.releaseVersion,environment:input.environment,decision,passed:readiness.passed,total:readiness.total},...context});return created});return Response.json({decision:record,readiness},{status:readiness.ready?201:409})}catch(error){const message=error instanceof Error?error.message:"LAUNCH_DECISION_FAILED";return Response.json({error:message},{status:["MFA_REQUIRED","REAUTH_REQUIRED"].includes(message)?428:message==="NOT_AUTHORIZED"?403:message==="AUTH_REQUIRED"?401:400})}}
