import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError } from "@/lib/film/feedback";
export async function GET(){try{await requireAdmin("moderation:read");return Response.json({items:await prisma.commentReport.findMany({where:{status:"OPEN"},orderBy:{createdAt:"asc"},take:100})})}catch(error){return feedbackError(error)}}
export async function PATCH(request:NextRequest){try{assertSameOrigin(request);const{admin}=await requireAdmin("moderation:write");const input=z.object({reportId:z.string(),action:z.enum(["DISMISS","REMOVE"]),note:z.string().max(1000).optional()}).parse(await request.json());const report=await prisma.commentReport.findUnique({where:{id:input.reportId}});if(!report)throw new Error("REPORT_NOT_FOUND");await prisma.$transaction(async transaction=>{if(input.action==="REMOVE")await transaction.comment.update({where:{id:report.commentId},data:{status:"REMOVED"}});await transaction.commentReport.update({where:{id:report.id},data:{status:input.action==="REMOVE"?"ACTIONED":"DISMISSED",moderationNote:input.note}});await transaction.auditLog.create({data:{adminUserId:admin.id,action:`COMMENT_REPORT_${input.action}`,targetType:"Comment",targetId:report.commentId,after:input}})});return Response.json({ok:true})}catch(error){return feedbackError(error)}}
