import type { AccessContext } from "@/server/services/entitlement-service";
import { decideEntitlement } from "@/server/services/entitlement-service";
import type { P2PFeatureFlags } from "./flags";

export type P2PPolicyInput = {
  flags: P2PFeatureFlags;
  configEnabled: boolean;
  browserEnabled: boolean;
  consent: boolean;
  peerUploadRequested: boolean;
  peerUploadAllowed: boolean;
  source: { authorizationVerified: boolean; status: string };
  entitlement: AccessContext;
};

export function authorizeP2PAttempt(input: P2PPolicyInput, now = new Date()) {
  if (!input.flags.enabled || !input.configEnabled) return { allowed: false, reason: "P2P_DISABLED" as const };
  if (!input.flags.browserEnabled || !input.browserEnabled) return { allowed: false, reason: "BROWSER_P2P_DISABLED" as const };
  if (!input.consent) return { allowed: false, reason: "CONSENT_REQUIRED" as const };
  if (!input.source.authorizationVerified) return { allowed: false, reason: "SOURCE_NOT_AUTHORIZED" as const };
  if (!(["AVAILABLE", "DEGRADED"] as string[]).includes(input.source.status)) return { allowed: false, reason: "SOURCE_UNAVAILABLE" as const };
  if (input.peerUploadRequested && !input.peerUploadAllowed) return { allowed: false, reason: "PEER_UPLOAD_DISABLED" as const };
  const entitlement = decideEntitlement(input.entitlement, now);
  if (!entitlement.allowed) return { allowed: false, reason: entitlement.reason, entitlement };
  return { allowed: true, reason: "AUTHORIZED" as const, entitlement, peerUploadEnabled: input.peerUploadRequested && input.peerUploadAllowed };
}

export function canManageP2P(roleNames: readonly string[], permissions: readonly string[]) {
  return roleNames.includes("SUPER_ADMIN") || roleNames.includes("CONTENT_ADMIN") || permissions.includes("p2p.manage");
}
