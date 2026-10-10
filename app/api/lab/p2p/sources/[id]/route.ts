import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { p2pSourceInputSchema, validateSourceNetworkMetadata } from "@/lib/p2p/validation";
import { configuredSourceHosts, safeError, serializeP2PSource } from "@/server/services/p2p-service";
import { requireP2PAdmin } from "@/server/services/request-identity-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireP2PAdmin(request);
  if (!actor) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  try {
    const { id } = await params;
    const before = await prisma.p2PSource.findUnique({ where: { id } });
    if (!before) return Response.json({ error: "Source not found" }, { status: 404 });
    const updates = await request.json() as Record<string, unknown>;
    const merged = { ...serializeP2PSource(before), ...updates };
    const input = validateSourceNetworkMetadata(p2pSourceInputSchema.parse(merged), configuredSourceHosts());
    const source = await prisma.p2PSource.update({ where: { id }, data: { ...input, expectedSizeBytes: input.expectedSizeBytes ? BigInt(input.expectedSizeBytes) : null, subtitles: input.subtitles, validationErrors: [] } });
    await prisma.auditLog.create({ data: { adminUserId: actor.admin.id, action: "P2P_SOURCE_UPDATED", targetType: "P2PSource", targetId: id, before: { status: before.status, authorizationVerified: before.authorizationVerified }, after: { status: source.status, authorizationVerified: source.authorizationVerified } } });
    return Response.json({ source: serializeP2PSource(source) });
  } catch (error) { return Response.json({ error: safeError(error), issues: error instanceof z.ZodError ? error.flatten() : undefined }, { status: 422 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireP2PAdmin(request);
  if (!actor) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const { id } = await params;
  const source = await prisma.p2PSource.update({ where: { id }, data: { status: "DISABLED" } });
  await prisma.auditLog.create({ data: { adminUserId: actor.admin.id, action: "P2P_SOURCE_DISABLED", targetType: "P2PSource", targetId: id, after: { status: "DISABLED" } } });
  return Response.json({ source: serializeP2PSource(source) });
}
