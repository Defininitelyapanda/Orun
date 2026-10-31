import { describe, expect, it } from "vitest";
import { createInvitationToken, invitationIsUsable } from "../lib/creator/invitations";
import { calculateFilmMetrics, COMPLETION_THRESHOLD } from "../lib/creator/analytics";
import { assertCreatorTransition, assertOwnerReviewTransition, assertPublishable, nextRevision } from "../lib/creator/workflow";

describe("invitation-only filmmaker onboarding", () => {
  it("uses single-use, expiring invitation token hashes", () => { const { token, tokenHash } = createInvitationToken(), now = new Date(); expect(token).not.toBe(tokenHash); expect(invitationIsUsable({ status: "SENT", tokenHash, expiresAt: new Date(now.getTime() + 1000) }, token, now)).toBe(true); expect(invitationIsUsable({ status: "REVOKED", tokenHash, expiresAt: new Date(now.getTime() + 1000) }, token, now)).toBe(false); expect(invitationIsUsable({ status: "SENT", tokenHash, expiresAt: new Date(now.getTime() - 1) }, token, now)).toBe(false); expect(invitationIsUsable({ status: "ACCEPTED", tokenHash: null, expiresAt: new Date(now.getTime() + 1000) }, token, now)).toBe(false); });
});

describe("owner-controlled submission workflow", () => {
  it("never permits a creator to approve or publish", () => { expect(() => assertCreatorTransition("PENDING_REVIEW", "APPROVED")).toThrow("INVALID_CREATOR_TRANSITION"); expect(() => assertCreatorTransition("APPROVED", "PUBLISHED")).toThrow("INVALID_CREATOR_TRANSITION"); });
  it("requires ready media and the exact current version for approval", () => { expect(() => assertOwnerReviewTransition({ decision: "APPROVED", processingStatus: "PROCESSING", currentVersion: 2, reviewedVersion: 2 })).toThrow("MEDIA_NOT_READY"); expect(() => assertOwnerReviewTransition({ decision: "APPROVED", processingStatus: "READY", currentVersion: 2, reviewedVersion: 1 })).toThrow("VERSION_NOT_CURRENT"); expect(() => assertOwnerReviewTransition({ decision: "APPROVED", processingStatus: "READY", currentVersion: 2, reviewedVersion: 2 })).not.toThrow(); });
  it("keeps approval and publication separate", () => { const approvedAt = new Date(); expect(() => assertPublishable({ submissionStatus: "PENDING_REVIEW", processingStatus: "READY", currentVersion: 1, approvedVersion: 1, approvedAt })).toThrow("SUBMISSION_NOT_APPROVED"); expect(() => assertPublishable({ submissionStatus: "APPROVED", processingStatus: "READY", currentVersion: 2, approvedVersion: 1, approvedAt })).toThrow("EXACT_VERSION_NOT_APPROVED"); expect(() => assertPublishable({ submissionStatus: "APPROVED", processingStatus: "READY", currentVersion: 2, approvedVersion: 2, approvedAt })).not.toThrow(); });
  it("creates a new revision number for material edits", () => expect(nextRevision(4)).toBe(5));
});

describe("privacy-preserving creator analytics", () => {
  it("deduplicates progress, counts actual watch time and uses a 90 percent completion threshold", () => { const start = new Date("2026-10-30T00:00:00Z"), at = (seconds: number) => new Date(start.getTime() + seconds * 1000), metrics = calculateFilmMetrics([{ sessionId: "a", occurredAt: at(0), positionSeconds: 0, durationSeconds: 100 }, { sessionId: "a", occurredAt: at(10), positionSeconds: 10, durationSeconds: 100 }, { sessionId: "a", occurredAt: at(10), positionSeconds: 10, durationSeconds: 100 }, { sessionId: "a", occurredAt: at(20), positionSeconds: 95, durationSeconds: 100 }, { sessionId: "b", occurredAt: at(0), positionSeconds: 0, durationSeconds: 200 }, { sessionId: "b", occurredAt: at(20), positionSeconds: 20, durationSeconds: 200 }]); expect(COMPLETION_THRESHOLD).toBe(.9); expect(metrics.startedViews).toBe(2); expect(metrics.qualifiedViews).toBe(1); expect(metrics.completedViews).toBe(1); expect(metrics.watchSeconds).toBe(60); expect(metrics.completionRate).toBe(.5); });
});
