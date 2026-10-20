import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { feedbackError } from "@/lib/film/feedback";
export async function GET(request:NextRequest){try{const query=request.nextUrl.searchParams.get("q")?.trim();const genres=await prisma.genre.findMany({where:{active:true,publicVisible:true,...(query?{OR:[{name:{contains:query,mode:"insensitive"}},{slug:{contains:query.toLowerCase().replace(/[^a-z0-9]+/g,"-")}},{synonyms:{has:query.toLowerCase()}}]}:{})},orderBy:[{sortOrder:"asc"},{name:"asc"}],take:query?30:1000});return Response.json({genres},{headers:{"cache-control":"public, max-age=300, stale-while-revalidate=3600"}})}catch(error){return feedbackError(error)}}
