import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { readP2PFeatureFlags } from "@/lib/p2p/flags";
import { defaultP2PConfig, effectiveP2PConfig, getP2PConfig, safeError } from "@/server/services/p2p-service";
import { requireP2PAdmin } from "@/server/services/request-identity-service";

const configSchema = z.object({
  enabled: z.boolean(), adminEnabled: z.boolean(), browserEnabled: z.boolean(), diagnosticsEnabled: z.boolean(),
  startupTimeoutMs: z.number().int().min(5_000).max(120_000),
  permittedSourceTypes: z.array(z.enum(["WEBTORRENT", "TORRENT_METADATA"])).min(1),
  diagnosticsRetentionDays: z.number().int().min(1).max(365), fallbackEnabled: z.boolean(),
  maxPlaybackDurationSeconds: z.number().int().min(60).max(43_200),
  maxTransferBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(), peerUploadEnabled: z.boolean(),
});

export async function GET() {
  try {
    const flags = readP2PFeatureFlags();
    if (process.env.NODE_ENV === "production" && !flags.enabled && !flags.adminEnabled) {
      return Response.json(effectiveP2PConfig(defaultP2PConfig), { headers: { "cache-control": "no-store" } });
    }
    const config = await getP2PConfig();
    return Response.json(effectiveP2PConfig(config), { headers: { "cache-control": "no-store" } });
  } catch (error) { return Response.json({ error: safeError(error) }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  const actor = await requireP2PAdmin(request);
  if (!actor) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  try {
    const input = configSchema.parse(await request.json());
    if (input.peerUploadEnabled) return Response.json({ error: "Peer uploading is not implemented and cannot be enabled." }, { status: 422 });
    const before = await prisma.p2PExperimentConfig.findUnique({ where: { id: "global" } });
    const config = await prisma.p2PExperimentConfig.upsert({
      where: { id: "global" }, create: { id: "global", ...input, maxTransferBytes: input.maxTransferBytes ? BigInt(input.maxTransferBytes) : null, updatedByAdminId: actor.admin.id },
      update: { ...input, maxTransferBytes: input.maxTransferBytes ? BigInt(input.maxTransferBytes) : null, updatedByAdminId: actor.admin.id },
    });
    await prisma.auditLog.create({ data: { adminUserId: actor.admin.id, action: "P2P_CONFIG_UPDATED", targetType: "P2PExperimentConfig", targetId: "global", before: before ? { enabled: before.enabled, adminEnabled: before.adminEnabled, browserEnabled: before.browserEnabled, diagnosticsEnabled: before.diagnosticsEnabled, startupTimeoutMs: before.startupTimeoutMs, fallbackEnabled: before.fallbackEnabled, peerUploadEnabled: before.peerUploadEnabled } : undefined, after: { ...input, maxTransferBytes: input.maxTransferBytes?.toString() ?? null } } });
    return Response.json(effectiveP2PConfig(config));
  } catch (error) { return Response.json({ error: safeError(error) }, { status: error instanceof z.ZodError ? 422 : 500 }); }
}
