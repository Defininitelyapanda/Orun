import { z } from "zod";

const infoHash = z.string().regex(/^(?:[a-f\d]{40}|[a-f\d]{64})$/i, "Info hash must be a 40 or 64 character hexadecimal value");
const safeText = z.string().trim().min(1).max(300);

export const p2pSourceInputSchema = z.object({
  filmId: z.string().min(1).max(100),
  ownershipStatus: z.enum(["OWNED", "LICENSED", "EXPLICIT_PERMISSION"]),
  authorizationReference: safeText,
  authorizationVerified: z.boolean().default(false),
  deliveryMethod: z.enum(["AUTHORIZED_P2P", "EXPERIMENTAL_SOURCE"]).default("AUTHORIZED_P2P"),
  sourceType: z.enum(["WEBTORRENT", "TORRENT_METADATA"]),
  manifestUrl: z.string().url().max(2048).optional(),
  infoHash: infoHash.optional(),
  fileIndex: z.number().int().min(0).max(10_000).optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
  expectedSizeBytes: z.number().int().positive().max(100 * 1024 ** 3).optional(),
  durationSeconds: z.number().int().positive().max(12 * 60 * 60),
  container: z.string().trim().max(40).optional(),
  videoCodec: z.string().trim().max(80).optional(),
  audioCodec: z.string().trim().max(80).optional(),
  languages: z.array(z.string().trim().min(2).max(20)).max(20).default([]),
  subtitles: z.array(z.object({ label: safeText, language: z.string().min(2).max(20), url: z.string().url().max(2048) })).max(30).default([]),
  status: z.enum(["DRAFT", "CHECKING", "AVAILABLE", "DEGRADED", "UNAVAILABLE", "UNSUPPORTED", "DISABLED"]).default("DRAFT"),
}).superRefine((value, context) => {
  if (!value.manifestUrl && !value.infoHash) context.addIssue({ code: "custom", message: "A manifest URL or info hash is required", path: ["manifestUrl"] });
  if (value.status === "AVAILABLE" && !value.authorizationVerified) context.addIssue({ code: "custom", message: "Authorization must be verified before a source can be available", path: ["authorizationVerified"] });
});

export const p2pSessionInputSchema = z.object({
  contentId: z.string().min(1).max(100),
  profileId: z.string().min(1).max(100),
  sourceId: z.string().min(1).max(100).optional(),
  consent: z.literal(true),
  privacy: z.object({
    allowP2P: z.literal(true),
    allowPeerUpload: z.boolean().default(false),
  }),
});

export const p2pEventInputSchema = z.object({
  sessionId: z.string().min(1).max(100),
  type: z.enum(["AVAILABILITY_CHECKED", "READY", "BUFFERING_STARTED", "BUFFERING_ENDED", "FIRST_FRAME", "PROGRESS", "COMPLETED", "FAILED", "CANCELLED", "FALLBACK"]),
  progress: z.number().min(0).max(1).optional(),
  peerCount: z.number().int().min(0).max(1_000_000).optional(),
  bytesFromPeers: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  bytesFromOrigin: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional(),
  failureCategory: z.enum(["NO_PEERS", "SOURCE_UNAVAILABLE", "UNSUPPORTED_CODEC", "UNSUPPORTED_BROWSER", "NETWORK_RESTRICTED", "SOURCE_INVALID", "PLAYBACK_FAILED", "USER_CANCELLED", "STARTUP_TIMEOUT"]).optional(),
  details: z.record(z.string(), z.union([z.string().max(500), z.number(), z.boolean(), z.null()])).optional(),
});

export function validatePublicSourceUrl(raw: string, allowedHosts: readonly string[] = []): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Only HTTPS source metadata URLs are permitted");
  if (url.username || url.password) throw new Error("Source URLs cannot contain credentials");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blockedNames = ["localhost", "metadata.google.internal", "metadata.azure.internal"];
  if (blockedNames.includes(host) || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Private network source URLs are not permitted");
  if (/^(?:127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host)) throw new Error("Private network source URLs are not permitted");
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) throw new Error("Private network source URLs are not permitted");
  if (allowedHosts.length && !allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) throw new Error("Source host is not on the configured allowlist");
  return url;
}

export function validateSourceNetworkMetadata(input: z.infer<typeof p2pSourceInputSchema>, allowedHosts: readonly string[] = []) {
  if (input.manifestUrl) validatePublicSourceUrl(input.manifestUrl, allowedHosts);
  for (const subtitle of input.subtitles) validatePublicSourceUrl(subtitle.url, allowedHosts);
  return input;
}
