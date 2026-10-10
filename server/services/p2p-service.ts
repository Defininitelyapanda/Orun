import { prisma } from "@/lib/db/prisma";
import { readP2PFeatureFlags } from "@/lib/p2p/flags";
import type { AccessContext } from "./entitlement-service";

export const defaultP2PConfig = {
  id: "global",
  enabled: false,
  adminEnabled: false,
  browserEnabled: false,
  diagnosticsEnabled: false,
  startupTimeoutMs: 20_000,
  permittedSourceTypes: ["WEBTORRENT", "TORRENT_METADATA"] as ("WEBTORRENT" | "TORRENT_METADATA")[],
  diagnosticsRetentionDays: 30,
  fallbackEnabled: true,
  maxPlaybackDurationSeconds: 14_400,
  maxTransferBytes: null as bigint | null,
  peerUploadEnabled: false,
};

export async function getP2PConfig() {
  const stored = await prisma.p2PExperimentConfig.findUnique({ where: { id: "global" } });
  return { ...defaultP2PConfig, ...stored };
}

export function effectiveP2PConfig(stored: Awaited<ReturnType<typeof getP2PConfig>>) {
  const flags = readP2PFeatureFlags();
  const development = process.env.NODE_ENV === "development";
  return {
    flags,
    enabled: flags.enabled && (stored.enabled || development),
    adminEnabled: flags.adminEnabled && (stored.adminEnabled || development),
    browserEnabled: flags.browserEnabled && (stored.browserEnabled || development),
    diagnosticsEnabled: flags.diagnosticsEnabled && (stored.diagnosticsEnabled || development),
    startupTimeoutMs: stored.startupTimeoutMs,
    permittedSourceTypes: stored.permittedSourceTypes,
    diagnosticsRetentionDays: stored.diagnosticsRetentionDays,
    fallbackEnabled: stored.fallbackEnabled,
    maxPlaybackDurationSeconds: stored.maxPlaybackDurationSeconds,
    maxTransferBytes: stored.maxTransferBytes ? Number(stored.maxTransferBytes) : undefined,
    peerUploadEnabled: flags.browserEnabled && stored.peerUploadEnabled,
  };
}

export function configuredSourceHosts() {
  return (process.env.ORUN_P2P_ALLOWED_SOURCE_HOSTS ?? "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
}

export function serializeP2PSource(source: {
  id: string; filmId: string; titleSnapshot: string; slugSnapshot: string; sourceType: string; manifestUrl: string | null; infoHash: string | null;
  fileIndex: number | null; fileName: string | null; expectedSizeBytes: bigint | null; durationSeconds: number; container: string | null;
  videoCodec: string | null; audioCodec: string | null; languages: string[]; subtitles: unknown; status: string; authorizationVerified: boolean;
  ownershipStatus: string; authorizationReference: string; deliveryMethod: string; validationErrors: string[]; createdAt: Date; updatedAt: Date;
}) {
  return { ...source, expectedSizeBytes: source.expectedSizeBytes ? Number(source.expectedSizeBytes) : undefined };
}

export async function entitlementContextFor(userId: string, profileId: string, filmId: string): Promise<{ context: AccessContext; profile: { id: string; userId: string; isKids: boolean }; film: { id: string; access: string; ageRating: string | null } } | null> {
  const [profile, film] = await Promise.all([
    prisma.profile.findFirst({ where: { id: profileId, userId }, select: { id: true, userId: true, isKids: true } }),
    prisma.film.findUnique({ where: { id: filmId }, select: { id: true, access: true, ageRating: true } }),
  ]);
  if (!profile || !film) return null;
  if (profile.isKids && film.ageRating && /(?:16|18|R)/i.test(film.ageRating)) return { profile, film, context: { contentAccess: "ADMIN_ONLY", availableInCountry: true, activeStreams: 0, maxStreams: 0 } };
  const [subscription, purchase, rental, explicit, activeOrigin, activeP2P, admin] = await Promise.all([
    prisma.subscription.findFirst({ where: { userId, status: { in: ["ACTIVE", "TRIALING"] } }, orderBy: { startsAt: "desc" } }),
    prisma.purchase.findFirst({ where: { userId, filmId } }),
    prisma.rental.findFirst({ where: { userId, filmId, expiresAt: { gt: new Date() } }, orderBy: { expiresAt: "desc" } }),
    prisma.entitlement.findFirst({ where: { userId, filmId, revokedAt: null, startsAt: { lte: new Date() }, AND: [{ OR: [{ profileId }, { profileId: null }] }, { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }] } }),
    prisma.playbackSession.count({ where: { profileId, endedAt: null } }),
    prisma.p2PPlaybackSession.count({ where: { profileId, endedAt: null } }),
    prisma.adminUser.findUnique({ where: { userId }, select: { active: true } }),
  ]);
  const plan = subscription ? await prisma.subscriptionPlan.findUnique({ where: { id: subscription.planId } }) : null;
  const maxStreams = plan?.maxStreams ?? 1;
  return {
    profile,
    film,
    context: {
      contentAccess: film.access as AccessContext["contentAccess"],
      plan: plan?.code as AccessContext["plan"],
      purchase: Boolean(purchase || explicit?.source === "PURCHASE"),
      rentalExpiresAt: rental?.expiresAt ?? (explicit?.source === "RENTAL" ? explicit.expiresAt ?? undefined : undefined),
      admin: Boolean(admin?.active || explicit?.source === "ADMIN_GRANT"),
      availableInCountry: true,
      activeStreams: activeOrigin + activeP2P,
      maxStreams,
    },
  };
}

export function safeError(error: unknown) {
  if (process.env.NODE_ENV === "development" && error instanceof Error) return error.message;
  return "The request could not be completed.";
}

export async function deleteExpiredP2PDiagnostics(now = new Date()) {
  const config = await getP2PConfig();
  const cutoff = new Date(now.getTime() - config.diagnosticsRetentionDays * 86_400_000);
  return prisma.p2PPlaybackEvent.deleteMany({ where: { occurredAt: { lt: cutoff } } });
}
