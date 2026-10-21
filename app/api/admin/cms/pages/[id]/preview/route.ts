import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { createPreviewCredential } from "@/lib/cms/workflow";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{assertSameOrigin(request);const{admin}=await requireAdmin("cms:write"),{id}=await params,page=await prisma.page.findUnique({where:{id},select:{id:true}});if(!page)return Response.json({error:"CMS_PAGE_NOT_FOUND"},{status:404});const{token,tokenHash}=createPreviewCredential(),expiresAt=new Date(Date.now()+60*60_000),context=auditRequestContext(request);await prisma.$transaction(async tx=>{await tx.pagePreviewToken.updateMany({where:{pageId:id,revokedAt:null},data:{revokedAt:new Date()}});await tx.pagePreviewToken.create({data:{pageId:id,tokenHash,expiresAt,createdByAdminId:admin.id}});await appendAuditLog(tx,{adminUserId:admin.id,action:"CMS_PREVIEW_ISSUED",targetType:"Page",targetId:id,after:{expiresAt},...context})});return Response.json({previewUrl:`/preview/${token}`,expiresAt})}catch(error){const message=error instanceof Error?error.message:"CMS_PREVIEW_FAILED";return Response.json({error:message},{status:message==="AUTH_REQUIRED"?401:message==="NOT_AUTHORIZED"?403:400})}
}
