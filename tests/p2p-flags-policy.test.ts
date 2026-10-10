import { describe, expect, it } from "vitest";
import { readP2PFeatureFlags } from "@/lib/p2p/flags";
import { authorizeP2PAttempt, canManageP2P } from "@/lib/p2p/policy";

const flags = { enabled: true, adminEnabled: true, browserEnabled: true, diagnosticsEnabled: true };
const entitlement = { contentAccess: "PREMIUM" as const, plan: "PREMIUM" as const, availableInCountry: true, activeStreams: 0, maxStreams: 2 };
const base = { flags, configEnabled: true, browserEnabled: true, consent: true, peerUploadRequested: false, peerUploadAllowed: false, source: { authorizationVerified: true, status: "AVAILABLE" }, entitlement };

describe("P2P feature isolation and policy", () => {
  it("defaults every production flag off", () => expect(readP2PFeatureFlags({ NODE_ENV: "production" })).toEqual({ enabled: false, adminEnabled: false, browserEnabled: false, diagnosticsEnabled: false }));
  it("rejects unauthorized media", () => expect(authorizeP2PAttempt({ ...base, source: { ...base.source, authorizationVerified: false } }).reason).toBe("SOURCE_NOT_AUTHORIZED"));
  it("honours subscription entitlements", () => expect(authorizeP2PAttempt(base).allowed).toBe(true));
  it("rejects expired rental access", () => expect(authorizeP2PAttempt({ ...base, entitlement: { ...entitlement, contentAccess: "RENT", plan: undefined, rentalExpiresAt: new Date(0) } }).allowed).toBe(false));
  it("reports unavailable sources without inventing peer counts", () => expect(authorizeP2PAttempt({ ...base, source: { ...base.source, status: "UNAVAILABLE" } }).reason).toBe("SOURCE_UNAVAILABLE"));
  it("keeps peer uploading disabled unless both requested and allowed", () => expect(authorizeP2PAttempt({ ...base, peerUploadRequested: true }).reason).toBe("PEER_UPLOAD_DISABLED"));
  it("enforces P2P admin roles", () => { expect(canManageP2P(["ANALYST"], ["analytics.read"])).toBe(false); expect(canManageP2P(["CONTENT_ADMIN"], [])).toBe(true); });
});
