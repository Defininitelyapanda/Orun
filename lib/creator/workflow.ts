import type { CreatorProcessingStatus, CreatorSubmissionStatus } from "@/generated/prisma/client";

const creatorTransitions: Record<CreatorSubmissionStatus, readonly CreatorSubmissionStatus[]> = {
  DRAFT: ["UPLOADING", "PENDING_REVIEW"], UPLOADING: ["PROCESSING", "PROCESSING_FAILED", "DRAFT"],
  PROCESSING: ["PENDING_REVIEW", "PROCESSING_FAILED"], PENDING_REVIEW: ["WITHDRAWAL_REQUESTED"],
  APPROVED: [], PUBLISHED: ["WITHDRAWAL_REQUESTED"], CHANGES_REQUESTED: ["DRAFT", "UPLOADING", "PENDING_REVIEW"],
  REJECTED: [], PROCESSING_FAILED: ["UPLOADING", "DRAFT"], WITHDRAWAL_REQUESTED: [], UNPUBLISHED: ["PENDING_REVIEW"],
};

export function assertCreatorTransition(from: CreatorSubmissionStatus, to: CreatorSubmissionStatus) {
  if (!creatorTransitions[from].includes(to)) throw new Error("INVALID_CREATOR_TRANSITION");
}

export function assertOwnerReviewTransition(input: { decision: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED"; processingStatus: CreatorProcessingStatus; currentVersion: number; reviewedVersion: number }) {
  if (input.currentVersion !== input.reviewedVersion) throw new Error("VERSION_NOT_CURRENT");
  if (input.decision === "APPROVED" && input.processingStatus !== "READY") throw new Error("MEDIA_NOT_READY");
}

export function assertPublishable(input: { submissionStatus: CreatorSubmissionStatus; processingStatus: CreatorProcessingStatus; currentVersion: number; approvedVersion: number; approvedAt: Date | null }) {
  if (input.submissionStatus !== "APPROVED" && input.submissionStatus !== "UNPUBLISHED") throw new Error("SUBMISSION_NOT_APPROVED");
  if (input.processingStatus !== "READY") throw new Error("MEDIA_NOT_READY");
  if (!input.approvedAt || input.currentVersion !== input.approvedVersion) throw new Error("EXACT_VERSION_NOT_APPROVED");
}

export function nextRevision(currentVersion: number) { return currentVersion + 1; }
