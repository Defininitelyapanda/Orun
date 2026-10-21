import { timingSafeEqual } from "node:crypto";
import { appendAuditLog } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/prisma";

function authorized(request:Request){const expected=process.env.CMS_SCHEDULER_SECRET,provided=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");if(!expected||!provided)return false;const left=Buffer.from(expected),right=Buffer.from(provided);return left.length===right.length&&timingSafeEqual(left,right)}
export async function POST(request:Request){if(!authorized(request))return Response.json({error:"NOT_AUTHORIZED"},{status:403});const now=new Date(),due=await prisma.page.findMany({where:{status:"READY",reviewStatus:"APPROVED",scheduledAt:{lte:now}},select:{id:true,slug:true,scheduledAt:true},take:100});await prisma.$transaction(async tx=>{for(const page of due){await tx.page.update({where:{id:page.id},data:{status:"PUBLISHED",publishedAt:now,scheduledAt:null}});await appendAuditLog(tx,{action:"CMS_SCHEDULE_PUBLISHED",targetType:"Page",targetId:page.id,before:{scheduledAt:page.scheduledAt},after:{publishedAt:now},metadata:{actor:"scheduler",slug:page.slug}})}});return Response.json({published:due.length,processedAt:now})}
