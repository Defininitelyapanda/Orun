import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError } from "@/lib/film/feedback";
import { taxonomySlug } from "@/lib/taxonomy/catalog";

const kindSchema=z.enum(["genre","theme","tone","format"]);
const itemSchema=z.object({kind:kindSchema,name:z.string().trim().min(2).max(100),slug:z.string().trim().max(120).optional(),description:z.string().trim().max(1200).nullable().optional(),parentId:z.string().nullable().optional(),localizedNames:z.record(z.string(),z.string().max(100)).optional(),synonyms:z.array(z.string().trim().min(1).max(80)).max(40).optional(),recommendationTags:z.array(z.string().trim().min(1).max(80)).max(40).optional(),active:z.boolean().optional(),publicVisible:z.boolean().optional(),featured:z.boolean().optional(),artworkUrl:z.string().url().max(2000).nullable().optional(),sortOrder:z.number().int().min(0).max(100000).optional()});

export async function GET(){
 try{
  await requireAdmin("catalog:read");
  const[genres,themes,tones,formats,usage]=await Promise.all([
   prisma.genre.findMany({orderBy:[{sortOrder:"asc"},{name:"asc"}]}),prisma.storyTheme.findMany({orderBy:[{sortOrder:"asc"},{name:"asc"}]}),prisma.tone.findMany({orderBy:[{sortOrder:"asc"},{name:"asc"}]}),prisma.contentFormatTaxon.findMany({orderBy:[{sortOrder:"asc"},{name:"asc"}]}),prisma.filmGenre.groupBy({by:["genreId"],_count:{filmId:true}}),
  ]);
  const counts=Object.fromEntries(usage.map(item=>[item.genreId,item._count.filmId]));
  return Response.json({genres:genres.map(item=>({...item,titleCount:counts[item.id]??0})),themes,tones,formats});
 }catch(error){return feedbackError(error)}
}

async function saveItem(input:z.infer<typeof itemSchema>){
 const slug=input.slug?taxonomySlug(input.slug):taxonomySlug(input.name);const common={name:input.name,description:input.description??undefined,active:input.active??true,publicVisible:input.publicVisible??true,sortOrder:input.sortOrder??0};
 if(input.kind==="genre")return prisma.genre.upsert({where:{slug},create:{slug,...common,parentId:input.parentId,localizedNames:input.localizedNames,synonyms:input.synonyms??[],recommendationTags:input.recommendationTags??[],featured:input.featured??false,artworkUrl:input.artworkUrl},update:{...common,parentId:input.parentId,localizedNames:input.localizedNames,synonyms:input.synonyms,recommendationTags:input.recommendationTags,featured:input.featured,artworkUrl:input.artworkUrl,archivedAt:input.active===false?new Date():null}});
 if(input.kind==="theme")return prisma.storyTheme.upsert({where:{slug},create:{slug,...common,synonyms:input.synonyms??[]},update:{...common,synonyms:input.synonyms}});
 if(input.kind==="tone")return prisma.tone.upsert({where:{slug},create:{slug,...common},update:common});
 return prisma.contentFormatTaxon.upsert({where:{slug},create:{slug,...common},update:common});
}

export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const{admin}=await requireAdmin("catalog:write");const payload=await request.json();const parsed=z.union([itemSchema,z.object({items:z.array(itemSchema).min(1).max(1000)})]).parse(payload);const items="items" in parsed?parsed.items:[parsed];const saved=[];for(const item of items)saved.push(await saveItem(item));
  await prisma.auditLog.create({data:{adminUserId:admin.id,action:items.length>1?"TAXONOMY_IMPORT":"TAXONOMY_CREATE",targetType:"Taxonomy",targetId:saved[0]!.id,after:{count:items.length}}});return Response.json({items:saved},{status:201});
 }catch(error){return feedbackError(error)}
}

const updateSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("update"),id:z.string(),data:itemSchema.omit({kind:true}).partial()}),z.object({action:z.literal("archive"),id:z.string(),confirm:z.boolean().default(false)}),z.object({action:z.literal("merge"),id:z.string(),targetId:z.string(),confirm:z.boolean().default(false)}),z.object({action:z.literal("reorder"),items:z.array(z.object({id:z.string(),sortOrder:z.number().int().min(0).max(100000)})).min(1).max(1000)}),
]);

export async function PATCH(request:NextRequest){
 try{
  assertSameOrigin(request);const{admin}=await requireAdmin("catalog:write");const input=updateSchema.parse(await request.json());
  if(input.action==="reorder"){await prisma.$transaction(input.items.map(item=>prisma.genre.update({where:{id:item.id},data:{sortOrder:item.sortOrder}})));return Response.json({ok:true})}
  const source=await prisma.genre.findUnique({where:{id:input.id}});if(!source)throw new Error("GENRE_NOT_FOUND");const affected=await prisma.filmGenre.count({where:{genreId:source.id}});if(input.action!=="update"&&!input.confirm)return Response.json({confirmationRequired:true,affectedTitles:affected},{status:409});
  if(input.action==="update"){const data=input.data;const updated=await prisma.genre.update({where:{id:source.id},data:{name:data.name,description:data.description,parentId:data.parentId,localizedNames:data.localizedNames,synonyms:data.synonyms,recommendationTags:data.recommendationTags,active:data.active,publicVisible:data.publicVisible,featured:data.featured,artworkUrl:data.artworkUrl,sortOrder:data.sortOrder,archivedAt:data.active===false?new Date():data.active===true?null:undefined}});return Response.json({item:updated,affectedTitles:affected})}
  if(input.action==="archive")await prisma.genre.update({where:{id:source.id},data:{active:false,publicVisible:false,archivedAt:new Date()}});
  else{if(input.id===input.targetId)throw new Error("INVALID_MERGE");const target=await prisma.genre.findUnique({where:{id:input.targetId}});if(!target?.active)throw new Error("MERGE_TARGET_NOT_ACTIVE");await prisma.$transaction(async tx=>{const assignments=await tx.filmGenre.findMany({where:{genreId:source.id}});for(const assignment of assignments){const key={filmId_genreId:{filmId:assignment.filmId,genreId:target.id}};const existing=await tx.filmGenre.findUnique({where:key});if(existing){if(assignment.isPrimary&&!existing.isPrimary)await tx.filmGenre.update({where:key,data:{isPrimary:true}})}else await tx.filmGenre.create({data:{filmId:assignment.filmId,genreId:target.id,isPrimary:assignment.isPrimary,source:assignment.source,reviewStatus:assignment.reviewStatus}})}await tx.filmGenre.deleteMany({where:{genreId:source.id}});await tx.genre.update({where:{id:source.id},data:{active:false,publicVisible:false,archivedAt:new Date(),mergedIntoId:target.id}})})}
  await prisma.auditLog.create({data:{adminUserId:admin.id,action:`TAXONOMY_${input.action.toUpperCase()}`,targetType:"Genre",targetId:source.id,after:{affectedTitles:affected,...input}}});return Response.json({ok:true,affectedTitles:affected});
 }catch(error){return feedbackError(error)}
}
