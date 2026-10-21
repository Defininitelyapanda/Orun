import { z } from "zod";
import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { normalizeRedirectPath } from "@/lib/cms/workflow";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

const inputSchema=z.object({sourcePath:z.string().max(1000),destinationPath:z.string().max(1000),statusCode:z.union([z.literal(301),z.literal(302),z.literal(307),z.literal(308)]).default(308),active:z.boolean().default(true)});
export async function GET(){try{await requireAdmin("cms:read");return Response.json({redirects:await prisma.redirectRule.findMany({orderBy:{updatedAt:"desc"},take:200})})}catch(error){return Response.json({error:error instanceof Error?error.message:"CMS_REDIRECT_FAILED"},{status:403})}}
export async function POST(request:Request){try{assertSameOrigin(request);const{admin}=await requireAdmin({permission:"cms:approve",requireMfa:true,requireRecentAuth:true}),input=inputSchema.parse(await request.json()),sourcePath=normalizeRedirectPath(input.sourcePath),destinationPath=normalizeRedirectPath(input.destinationPath);if(sourcePath===destinationPath)throw new Error("CMS_REDIRECT_LOOP");const rule=await prisma.redirectRule.upsert({where:{sourcePath},create:{...input,sourcePath,destinationPath,createdByAdminId:admin.id},update:{destinationPath,statusCode:input.statusCode,active:input.active}});await appendAuditLog(prisma,{adminUserId:admin.id,action:"CMS_REDIRECT_UPSERTED",targetType:"RedirectRule",targetId:rule.id,after:rule,...auditRequestContext(request)});return Response.json({rule},{status:201})}catch(error){const message=error instanceof Error?error.message:"CMS_REDIRECT_FAILED";return Response.json({error:message},{status:["MFA_REQUIRED","REAUTH_REQUIRED"].includes(message)?428:message==="NOT_AUTHORIZED"?403:400})}}
