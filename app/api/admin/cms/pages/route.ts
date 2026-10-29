import type { Prisma } from "@/generated/prisma/client";
import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { cmsPageInput } from "@/lib/cms/workflow";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

function errorResponse(error:unknown){const message=error instanceof Error?error.message:"CMS_REQUEST_FAILED";const status=message==="AUTH_REQUIRED"?401:message==="NOT_AUTHORIZED"?403:400;return Response.json({error:message},{status})}

export async function GET(){
 try{await requireAdmin("cms:read");const pages=await prisma.page.findMany({orderBy:{updatedAt:"desc"},take:100,include:{_count:{select:{revisions:true,previewTokens:true}}}});return Response.json({pages})}catch(error){return errorResponse(error)}
}

export async function POST(request:Request){
 try{
  assertSameOrigin(request);const{admin}=await requireAdmin("cms:write"),input=cmsPageInput.parse(await request.json()),context=auditRequestContext(request),sections=input.sections as Prisma.InputJsonValue;
  const page=await prisma.$transaction(async tx=>{const created=await tx.page.create({data:{slug:input.slug,title:input.title,sections,revisions:{create:{version:1,title:input.title,sections,changeNote:input.changeNote,createdByAdminId:admin.id}}}});await appendAuditLog(tx,{adminUserId:admin.id,action:"CMS_PAGE_CREATED",targetType:"Page",targetId:created.id,after:{slug:created.slug,title:created.title,version:1},...context});return created});
  return Response.json({page},{status:201});
 }catch(error){return errorResponse(error)}
}
