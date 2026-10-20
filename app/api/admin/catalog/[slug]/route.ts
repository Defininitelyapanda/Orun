import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError } from "@/lib/film/feedback";

const identifiers=z.array(z.string().min(1).max(120)).max(40);
const schema=z.object({
 year:z.number().int().min(1888).max(2200).optional(),runtimeMinutes:z.number().int().min(0).max(2000).optional(),ageRating:z.string().max(20).optional(),contentFormat:z.string().max(50).optional(),region:z.string().max(80).nullable().optional(),culturalContext:z.string().max(1000).nullable().optional(),filmingLocations:z.array(z.string().max(100)).max(30).optional(),productionStatus:z.string().max(40).optional(),productionCompany:z.string().max(160).nullable().optional(),originalReleaseDate:z.coerce.date().nullable().optional(),awards:z.array(z.string().max(200)).max(100).optional(),festivalSelections:z.array(z.string().max(200)).max(100).optional(),aspectRatio:z.string().max(20).nullable().optional(),originalLanguage:z.string().max(50).optional(),dubbedLanguages:z.array(z.string().max(50)).max(30).optional(),subtitleLanguages:z.array(z.string().max(50)).max(30).optional(),closedCaptions:z.boolean().optional(),audioDescription:z.boolean().optional(),signLanguageInterpretation:z.boolean().optional(),videoQualities:z.array(z.string().max(20)).max(10).optional(),trending:z.boolean().optional(),featured:z.boolean().optional(),heroOrder:z.number().int().min(0).max(1000).nullable().optional(),heroDisplaySeconds:z.number().int().min(4).max(60).nullable().optional(),privateMessagesEnabled:z.boolean().optional(),commentsEnabled:z.boolean().optional(),ratingsEnabled:z.boolean().optional(),trailersEnabled:z.boolean().optional(),primaryGenre:z.string().max(120).optional(),secondaryGenres:identifiers.optional(),genres:identifiers.optional(),themes:identifiers.optional(),tones:identifiers.optional(),formats:identifiers.optional(),countryCodes:z.array(z.string().length(2)).max(20).optional(),audioLanguageCodes:z.array(z.string().min(2).max(20)).max(30).optional(),subtitleLanguageCodes:z.array(z.string().min(2).max(20)).max(30).optional()
}).superRefine((value,context)=>{if(value.primaryGenre&&value.secondaryGenres?.includes(value.primaryGenre))context.addIssue({code:"custom",path:["secondaryGenres"],message:"The primary genre cannot also be secondary."})});

async function resolveIds<T extends{id:string}>(ids:string[],find:(values:string[])=>Promise<T[]>){return find(ids)}

export async function GET(_request:NextRequest,{params}:{params:Promise<{slug:string}>}){
 try{await requireAdmin("catalog:read");const film=await prisma.film.findUnique({where:{slug:(await params).slug}});if(!film)throw new Error("FILM_NOT_FOUND");const[genres,themes,tones,formats,countries,languages]=await Promise.all([prisma.filmGenre.findMany({where:{filmId:film.id}}),prisma.filmStoryTheme.findMany({where:{filmId:film.id}}),prisma.filmTone.findMany({where:{filmId:film.id}}),prisma.filmFormat.findMany({where:{filmId:film.id}}),prisma.filmCountry.findMany({where:{filmId:film.id}}),prisma.filmLanguage.findMany({where:{filmId:film.id}})]);return Response.json({film,genres,themes,tones,formats,countries,languages})}catch(error){return feedbackError(error)}
}

export async function PATCH(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
 try{
  assertSameOrigin(request);const{admin}=await requireAdmin("catalog:write");const input=schema.parse(await request.json());const film=await prisma.film.findUnique({where:{slug:(await params).slug}});if(!film)throw new Error("FILM_NOT_FOUND");
  const{primaryGenre,secondaryGenres,genres,themes,tones,formats,countryCodes,audioLanguageCodes,subtitleLanguageCodes,...metadata}=input;
  await prisma.$transaction(async tx=>{
   await tx.film.update({where:{id:film.id},data:metadata});
   const genreValues=primaryGenre?[primaryGenre,...(secondaryGenres??[])]:genres;
   if(genreValues){const rows=await resolveIds(genreValues,values=>tx.genre.findMany({where:{OR:[{id:{in:values}},{slug:{in:values}}],active:true}}));const byValue=new Map(rows.flatMap(row=>[[row.id,row],[row.slug,row]]));if(primaryGenre&&!byValue.has(primaryGenre))throw new Error("PRIMARY_GENRE_NOT_FOUND");await tx.filmGenre.deleteMany({where:{filmId:film.id}});for(const [index,value]of genreValues.entries()){const row=byValue.get(value);if(row)await tx.filmGenre.create({data:{filmId:film.id,genreId:row.id,isPrimary:primaryGenre?value===primaryGenre:index===0}})}}
   if(themes){const rows=await tx.storyTheme.findMany({where:{OR:[{id:{in:themes}},{slug:{in:themes}}],active:true}});await tx.filmStoryTheme.deleteMany({where:{filmId:film.id}});for(const row of rows)await tx.filmStoryTheme.create({data:{filmId:film.id,themeId:row.id}})}
   if(tones){const rows=await tx.tone.findMany({where:{OR:[{id:{in:tones}},{slug:{in:tones}}],active:true}});await tx.filmTone.deleteMany({where:{filmId:film.id}});for(const row of rows)await tx.filmTone.create({data:{filmId:film.id,toneId:row.id}})}
   if(formats){const rows=await tx.contentFormatTaxon.findMany({where:{OR:[{id:{in:formats}},{slug:{in:formats}}],active:true}});await tx.filmFormat.deleteMany({where:{filmId:film.id}});for(const [index,row]of rows.entries())await tx.filmFormat.create({data:{filmId:film.id,formatId:row.id,isPrimary:index===0}})}
   if(countryCodes){await tx.filmCountry.deleteMany({where:{filmId:film.id}});for(const[index,code]of countryCodes.entries()){const normalized=code.toUpperCase();const country=await tx.country.upsert({where:{code:normalized},create:{code:normalized,name:normalized},update:{}});await tx.filmCountry.create({data:{filmId:film.id,countryId:country.id,isPrimary:index===0}})}}
   if(audioLanguageCodes||subtitleLanguageCodes){await tx.filmLanguage.deleteMany({where:{filmId:film.id}});for(const[kind,codes]of [["AUDIO",audioLanguageCodes??[]],["SUBTITLE",subtitleLanguageCodes??[]]]as const)for(const code of codes){const language=await tx.language.upsert({where:{code},create:{code,name:code},update:{}});await tx.filmLanguage.create({data:{filmId:film.id,languageId:language.id,kind,isOriginal:kind==="AUDIO"&&code===metadata.originalLanguage}})}}
   await tx.auditLog.create({data:{adminUserId:admin.id,action:"CATALOG_CLASSIFICATION_UPDATE",targetType:"Film",targetId:film.id,after:input}});
  });return Response.json({ok:true});
 }catch(error){return feedbackError(error)}
}
