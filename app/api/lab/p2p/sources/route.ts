import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { p2pSourceInputSchema, validateSourceNetworkMetadata } from "@/lib/p2p/validation";
import { configuredSourceHosts, safeError, serializeP2PSource } from "@/server/services/p2p-service";
import { requireP2PAdmin } from "@/server/services/request-identity-service";
import { consumeRateLimit } from "@/server/security/rate-limit";

export async function GET(request: Request) {
  const actor = await requireP2PAdmin(request);
  if (!actor) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const sources = await prisma.p2PSource.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
  return Response.json({ sources: sources.map(serializeP2PSource) });
}

export async function POST(request: Request) {
  const actor = await requireP2PAdmin(request);
  if (!actor) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  if (!consumeRateLimit(`p2p-source:${actor.user.id}`, 15).allowed) return Response.json({ error: "Too many source changes" }, { status: 429 });
  try {
    const input = validateSourceNetworkMetadata(p2pSourceInputSchema.parse(await request.json()), configuredSourceHosts());
    const film = await prisma.film.findUnique({ where: { id: input.filmId }, select: { id: true, title: true, slug: true } });
    if (!film) return Response.json({ error: "Film not found" }, { status: 404 });
    const source = await prisma.p2PSource.create({ data: {
      ...input, titleSnapshot: film.title, slugSnapshot: film.slug, expectedSizeBytes: input.expectedSizeBytes ? BigInt(input.expectedSizeBytes) : null,
      subtitles: input.subtitles, validationErrors: [], createdByAdminId: actor.admin.id,
    } });
    await prisma.auditLog.create({ data: { adminUserId: actor.admin.id, action: "P2P_SOURCE_CREATED", targetType: "P2PSource", targetId: source.id, after: { filmId: film.id, sourceType: source.sourceType, authorizationVerified: source.authorizationVerified } } });
    return Response.json({ source: serializeP2PSource(source) }, { status: 201 });
  } catch (error) { return Response.json({ error: safeError(error), issues: error instanceof z.ZodError ? error.flatten() : undefined }, { status: 422 }); }
}
