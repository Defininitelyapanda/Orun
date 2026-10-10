import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { readP2PFeatureFlags } from "@/lib/p2p/flags";
import { authorizeP2PAttempt } from "@/lib/p2p/policy";
import { p2pSessionInputSchema } from "@/lib/p2p/validation";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { effectiveP2PConfig, entitlementContextFor, getP2PConfig, safeError, serializeP2PSource } from "@/server/services/p2p-service";
import { requestIdentity } from "@/server/services/request-identity-service";
import { films as demoFilms } from "@/server/demo/catalog";

export async function POST(request: Request) {
  const flags = readP2PFeatureFlags();
  if (!flags.enabled || !flags.browserEnabled) return Response.json({ error: "P2P Lab is disabled" }, { status: 404 });
  const user = await requestIdentity(request);
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!consumeRateLimit(`p2p-session:${user.id}`, 10).allowed) return Response.json({ error: "Too many playback attempts" }, { status: 429 });
  try {
    const input = p2pSessionInputSchema.parse(await request.json());
    const storedConfig = await getP2PConfig();
    const config = effectiveP2PConfig(storedConfig);
    const source = await prisma.p2PSource.findFirst({ where: {
      id: input.sourceId, filmId: input.contentId, sourceType: { in: storedConfig.permittedSourceTypes }, status: { in: ["AVAILABLE", "DEGRADED"] }, authorizationVerified: true,
    }, orderBy: { updatedAt: "desc" } });
    if (!source) return Response.json({ error: "No authorized experimental source is available for this film", code: "SOURCE_UNAVAILABLE", fallbackUrl: `/watch/${input.contentId}` }, { status: 404 });
    const access = await entitlementContextFor(user.id, input.profileId, input.contentId);
    if (!access) return Response.json({ error: "Film or profile not found" }, { status: 404 });
    const policy = authorizeP2PAttempt({
      flags: config.flags, configEnabled: storedConfig.enabled, browserEnabled: storedConfig.browserEnabled, consent: input.consent,
      peerUploadRequested: input.privacy.allowPeerUpload, peerUploadAllowed: storedConfig.peerUploadEnabled,
      source, entitlement: access.context,
    });
    if (!policy.allowed) return Response.json({ error: "Experimental playback is not authorized", code: policy.reason, fallbackUrl: storedConfig.fallbackEnabled ? `/watch/${input.contentId}` : undefined }, { status: 403 });
    const standardContentId = demoFilms.find((film) => film.slug === source.slugSnapshot)?.id ?? source.filmId;
    const session = await prisma.p2PPlaybackSession.create({ data: {
      sourceId: source.id, filmId: source.filmId, userId: user.id, profileId: input.profileId, deliveryMethod: source.deliveryMethod,
      status: "CHECKING", sourceStatus: source.status, p2pConsent: true, peerUploadEnabled: policy.peerUploadEnabled,
      maxDurationSeconds: storedConfig.maxPlaybackDurationSeconds, maxTransferBytes: storedConfig.maxTransferBytes,
      browserCategory: request.headers.get("sec-ch-ua")?.slice(0, 200), deviceCategory: request.headers.get("sec-ch-ua-mobile") === "?1" ? "mobile" : "desktop",
    } });
    return Response.json({
      sessionId: session.id, source: serializeP2PSource(source), startupTimeoutMs: storedConfig.startupTimeoutMs,
      maxPlaybackDurationSeconds: storedConfig.maxPlaybackDurationSeconds, maxTransferBytes: storedConfig.maxTransferBytes ? Number(storedConfig.maxTransferBytes) : undefined,
      peerUploadEnabled: false, fallbackUrl: storedConfig.fallbackEnabled ? `/watch/${standardContentId}` : undefined,
    }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) { return Response.json({ error: safeError(error), issues: error instanceof z.ZodError ? error.flatten() : undefined }, { status: error instanceof z.ZodError ? 422 : 500 }); }
}
