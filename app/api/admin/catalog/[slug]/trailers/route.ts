import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError } from "@/lib/film/feedback";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){try{assertSameOrigin(request);const{admin}=await requireAdmin("media:write");const input=z.object({url:z.string().url().max(2000),thumbnailUrl:z.string().url().max(2000).optional(),languageCode:z.string().min(2).max(12).default("en"),durationSeconds:z.number().int().positive().max(3600).optional(),available:z.boolean().default(true)}).parse(await request.json());const film=await prisma.film.findUnique({where:{slug:(await params).slug}});if(!film)throw new Error("FILM_NOT_FOUND");const trailer=await prisma.trailerAsset.create({data:{...input,filmId:film.id,approvedAt:new Date()}});await prisma.auditLog.create({data:{adminUserId:admin.id,action:"TRAILER_CREATE",targetType:"TrailerAsset",targetId:trailer.id,after:input}});return Response.json(trailer,{status:201})}catch(error){return feedbackError(error)}}
