import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError } from "@/lib/film/feedback";
export async function GET(){try{await requireAdmin("catalog:read");const[genres,themes]=await Promise.all([prisma.genre.findMany({orderBy:[{sortOrder:"asc"},{name:"asc"}]}),prisma.storyTheme.findMany({orderBy:[{sortOrder:"asc"},{name:"asc"}]})]);return Response.json({genres,themes})}catch(error){return feedbackError(error)}}
export async function POST(request:NextRequest){try{assertSameOrigin(request);await requireAdmin("catalog:write");const input=z.object({type:z.enum(["genre","theme"]),name:z.string().trim().min(2).max(80)}).parse(await request.json());const slug=input.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");const item=input.type==="genre"?await prisma.genre.upsert({where:{slug},create:{slug,name:input.name},update:{name:input.name,active:true}}):await prisma.storyTheme.upsert({where:{slug},create:{slug,name:input.name},update:{name:input.name,active:true}});return Response.json(item,{status:201})}catch(error){return feedbackError(error)}}
