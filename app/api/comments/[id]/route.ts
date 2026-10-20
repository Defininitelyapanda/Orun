import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";
import { commentInput, feedbackError, requireViewer } from "@/lib/film/feedback";

async function ownedComment(id:string,profileId:string){const comment=await prisma.comment.findFirst({where:{id,profileId,status:"PUBLISHED"}});if(!comment)throw new Error("NOT_AUTHORIZED");return comment}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{assertSameOrigin(request);const{session,profile}=await requireViewer();assertRateLimit(`comment-edit:${session.user.id}`,10,60_000);const comment=await ownedComment((await params).id,profile.id);const{body}=commentInput.parse(await request.json());return Response.json({comment:await prisma.comment.update({where:{id:comment.id},data:{body}})})}catch(error){return feedbackError(error)}}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{assertSameOrigin(request);const{profile}=await requireViewer();const comment=await ownedComment((await params).id,profile.id);await prisma.comment.update({where:{id:comment.id},data:{status:"DELETED"}});return new Response(null,{status:204})}catch(error){return feedbackError(error)}}
