import { describe, expect, it } from "vitest";
import { p2pEventInputSchema, p2pSourceInputSchema, validatePublicSourceUrl, validateSourceNetworkMetadata } from "@/lib/p2p/validation";

const valid = { filmId: "film-1", ownershipStatus: "OWNED" as const, authorizationReference: "ORUN rights ledger #42", authorizationVerified: true, deliveryMethod: "AUTHORIZED_P2P" as const, sourceType: "TORRENT_METADATA" as const, infoHash: "a".repeat(40), durationSeconds: 30, languages: ["en"], subtitles: [], status: "AVAILABLE" as const };

describe("P2P source and diagnostic validation", () => {
  it("accepts authorized, bounded metadata", () => expect(validateSourceNetworkMetadata(p2pSourceInputSchema.parse(valid))).toMatchObject({ filmId: "film-1" }));
  it("rejects malformed source metadata", () => expect(() => p2pSourceInputSchema.parse({ ...valid, infoHash: "not-a-hash" })).toThrow());
  it("rejects unverified available sources", () => expect(() => p2pSourceInputSchema.parse({ ...valid, authorizationVerified: false })).toThrow());
  it("blocks local and cloud metadata URLs", () => { expect(() => validatePublicSourceUrl("https://127.0.0.1/source.torrent")).toThrow(); expect(() => validatePublicSourceUrl("https://metadata.google.internal/source.torrent")).toThrow(); });
  it("enforces an optional trusted-host allowlist", () => expect(() => validatePublicSourceUrl("https://untrusted.example/source.torrent", ["media.orun.test"])).toThrow());
  it("validates diagnostic bounds", () => { expect(p2pEventInputSchema.safeParse({ sessionId: "s1", type: "PROGRESS", progress: 0.5 }).success).toBe(true); expect(p2pEventInputSchema.safeParse({ sessionId: "s1", type: "PROGRESS", progress: 2 }).success).toBe(false); });
});
