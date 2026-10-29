import type { CmsReviewStatus,ContentStatus,Prisma } from "@/generated/prisma/client";
import { appendAuditLog,auditRequestContext } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { assertPublishable,cmsPageUpdate,workflowTransition } from "@/lib/cms/workflow";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

function errorResponse(error:unknown){const message=error instanceof Error?error.message:"CMS_REQUEST_FAILED";const status=message==="AUTH_REQUIRED"?401:message==="NOT_AUTHORIZED"?403:["MFA_REQUIRED","REAUTH_REQUIRED"].includes(message)?428:message==="CMS_PAGE_NOT_FOUND"?404:["CMS_APPROVAL_REQUIRED","CMS_INVALID_TRANSITION"].includes(message)?409:400;return Response.json({error:message},{status})}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 try{await requireAdmin("cms:read");const{id}=await params,page=await prisma.page.findUnique({where:{id},include:{revisions:{orderBy:{version:"desc"},take:50}}});if(!page)throw new Error("CMS_PAGE_NOT_FOUND");return Response.json({page})}catch(error){return errorResponse(error)}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  assertSameOrigin(request);const input=cmsPageUpdate.parse(await request.json()),approvalAction=["APPROVE","PUBLISH","SCHEDULE"].includes(input.action),sensitive=["PUBLISH","SCHEDULE"].includes(input.action),{admin}=await requireAdmin({permission:approvalAction?"cms:approve":"cms:write",requireMfa:sensitive,requireRecentAuth:sensitive}),{id}=await params,current=await prisma.page.findUnique({where:{id}});if(!current)throw new Error("CMS_PAGE_NOT_FOUND");
  let title=input.title??current.title,sections=(input.sections??current.sections) as Prisma.InputJsonValue,reviewStatus=current.reviewStatus,status=current.status,scheduledAt=current.scheduledAt,publishedAt=current.publishedAt;
  if(input.action==="RESTORE_REVISION"){if(!input.revisionVersion)throw new Error("CMS_REVISION_REQUIRED");const revision=await prisma.pageRevision.findUnique({where:{pageId_version:{pageId:id,version:input.revisionVersion}}});if(!revision)throw new Error("CMS_REVISION_NOT_FOUND");title=revision.title;sections=revision.sections as Prisma.InputJsonValue;reviewStatus="DRAFT";status="DRAFT";scheduledAt=null}
  else if(["SAVE_DRAFT","SUBMIT_REVIEW","APPROVE"].includes(input.action)){const next=workflowTransition(input.action as "SAVE_DRAFT"|"SUBMIT_REVIEW"|"APPROVE",current.reviewStatus);reviewStatus=next.reviewStatus as CmsReviewStatus;status=next.status as ContentStatus;scheduledAt=null}
  else{assertPublishable(current.reviewStatus);if(input.action==="PUBLISH"){status="PUBLISHED";publishedAt=new Date();scheduledAt=null}else{const when=input.scheduledAt?new Date(input.scheduledAt):null;if(!when||when<=new Date())throw new Error("CMS_FUTURE_SCHEDULE_REQUIRED");status="READY";scheduledAt=when}}
  const version=current.currentVersion+1,context=auditRequestContext(request),page=await prisma.$transaction(async tx=>{const updated=await tx.page.update({where:{id},data:{title,sections,reviewStatus,status,scheduledAt,publishedAt,currentVersion:version}});await tx.pageRevision.create({data:{pageId:id,version,title,sections,changeNote:input.changeNote??input.action,createdByAdminId:admin.id}});await appendAuditLog(tx,{adminUserId:admin.id,action:`CMS_${input.action}`,targetType:"Page",targetId:id,before:{status:current.status,reviewStatus:current.reviewStatus,version:current.currentVersion},after:{status,reviewStatus,version,scheduledAt},...context});return updated});
  return Response.json({page});
 }catch(error){return errorResponse(error)}
}
