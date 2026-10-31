import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { requireCreator } from "@/lib/creator/access";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

const metadataSchema = z.object({ title: z.string().trim().min(1).max(200), synopsis: z.string().trim().min(1).max(600), description: z.string().trim().min(1).max(5000), contentFormat: z.string().trim().min(1).max(80), genreIds: z.array(z.string().min(1)).min(1).max(10), subgenreIds: z.array(z.string()).max(10).default([]), themeIds: z.array(z.string()).max(20).default([]), languageCode: z.string().min(2).max(20), countryCode: z.string().length(2), releaseYear: z.number().int().min(1888).max(2200), runtimeMinutes: z.number().int().positive().max(2000), director: z.string().trim().min(1).max(200), credits: z.array(z.object({ name: z.string().max(200), role: z.string().max(120) })).max(500).default([]), castAndCrew: z.array(z.object({ name: z.string().max(200), role: z.string().max(120) })).max(1000).default([]), audienceClassification: z.string().max(80), audioLanguages: z.array(z.string()).max(30).default([]), subtitleLanguages: z.array(z.string()).max(30).default([]), closedCaptions: z.boolean().default(false), audioDescription: z.boolean().default(false) });
const schema = z.object({ metadata: metadataSchema, rightsDeclaration: z.object({ ownsRights: z.literal(true), territories: z.array(z.string()).min(1).max(250), validFrom: z.string().date().optional(), validUntil: z.string().date().optional(), declaration: z.string().min(20).max(5000) }) });

export async function GET() {
  try { const { creator } = await requireCreator(); const submissions = await prisma.filmSubmission.findMany({ where: { creatorProfileId: creator.id }, include: { versions: { orderBy: { version: "desc" }, take: 1 }, film: { select: { slug: true, status: true, publishedAt: true } } }, orderBy: { updatedAt: "desc" } }); return Response.json({ submissions }); }
  catch (error) { const message = error instanceof Error ? error.message : "SUBMISSIONS_FAILED"; return Response.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 403 }); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const { creator, session } = await requireCreator(), input = schema.parse(await request.json());
    const submission = await prisma.filmSubmission.create({ data: { creatorProfileId: creator.id, title: input.metadata.title, versions: { create: { version: 1, metadata: input.metadata as Prisma.InputJsonValue, rightsDeclaration: input.rightsDeclaration as Prisma.InputJsonValue, accessibility: { audioLanguages: input.metadata.audioLanguages, subtitleLanguages: input.metadata.subtitleLanguages, closedCaptions: input.metadata.closedCaptions, audioDescription: input.metadata.audioDescription }, createdByUserId: session.userId } } }, include: { versions: true } });
    return Response.json({ submission }, { status: 201 });
  } catch (error) { const message = error instanceof Error ? error.message : "SUBMISSION_CREATE_FAILED"; return Response.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : message.startsWith("CREATOR_") ? 403 : 400 }); }
}
