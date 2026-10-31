import { z } from "zod";
import { requireOwner } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { appendAuditLog, auditRequestContext } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { assertOwnerReviewTransition } from "@/lib/creator/workflow";

const schema = z
  .object({
    decision: z.enum(["APPROVED", "CHANGES_REQUESTED", "REJECTED"]),
    feedback: z.string().trim().min(3).max(5000).optional(),
    requiredChanges: z
      .array(z.string().trim().min(1).max(300))
      .max(50)
      .default([]),
  })
  .superRefine((value, context) => {
    if (value.decision !== "APPROVED" && !value.feedback)
      context.addIssue({
        code: "custom",
        path: ["feedback"],
        message: "Feedback is required.",
      });
  });
const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "untitled";
const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const number = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const { admin } = await requireOwner(),
      input = schema.parse(await request.json()),
      { id } = await params,
      current = await prisma.filmSubmission.findUnique({
        where: { id },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
    if (!current || current.status !== "PENDING_REVIEW")
      throw new Error("SUBMISSION_NOT_REVIEWABLE");
    const version = current.versions[0];
    if (!version) throw new Error("VERSION_NOT_FOUND");
    assertOwnerReviewTransition({
      decision: input.decision,
      processingStatus: version.processingStatus,
      currentVersion: current.currentVersionNumber,
      reviewedVersion: version.version,
    });
    const metadata = version.metadata as Record<string, unknown>,
      now = new Date(),
      nextStatus = input.decision === "APPROVED" ? "APPROVED" : input.decision;
    const updated = await prisma.$transaction(async (tx) => {
      let filmId = current.filmId;
      if (input.decision === "APPROVED" && !filmId) {
        const baseSlug = slugify(current.title),
          slug = `${baseSlug}-${current.id.slice(-6)}`;
        const film = await tx.film.create({
          data: {
            slug,
            title: current.title,
            description: text(metadata.synopsis, current.title),
            longDescription: text(metadata.description) || null,
            year: number(metadata.releaseYear, new Date().getUTCFullYear()),
            runtimeMinutes: number(metadata.runtimeMinutes, 1),
            ageRating: text(metadata.audienceClassification) || null,
            countryCode: text(metadata.countryCode, "KE"),
            originalLanguage: text(metadata.languageCode, "en"),
            contentFormat: text(metadata.contentFormat, "FEATURE_FILM"),
            status: "READY",
            access: "ADMIN_ONLY",
            productionCompany: null,
          },
        });
        filmId = film.id;
        await tx.creatorFilmPermission.upsert({
          where: {
            creatorProfileId_filmId: {
              creatorProfileId: current.creatorProfileId,
              filmId,
            },
          },
          create: {
            creatorProfileId: current.creatorProfileId,
            filmId,
            grantedByAdminId: admin.id,
          },
          update: { active: true, revokedAt: null, grantedByAdminId: admin.id },
        });
      }
      await tx.submissionReview.create({
        data: {
          versionId: version.id,
          decision: input.decision,
          feedback: input.feedback,
          requiredChanges: input.requiredChanges,
          reviewedByAdminId: admin.id,
        },
      });
      if (input.decision === "APPROVED")
        await tx.filmSubmissionVersion.update({
          where: { id: version.id },
          data: { approvedAt: now, approvedByAdminId: admin.id },
        });
      const submission = await tx.filmSubmission.update({
        where: { id },
        data: {
          filmId,
          status: nextStatus,
          lastFeedbackAt:
            input.decision === "APPROVED" ? current.lastFeedbackAt : now,
        },
      });
      await tx.creatorNotification.create({
        data: {
          creatorProfileId: current.creatorProfileId,
          type: `FILM_${input.decision}`,
          title:
            input.decision === "APPROVED"
              ? "Film approved"
              : input.decision === "CHANGES_REQUESTED"
                ? "Changes requested"
                : "Submission decision",
          body:
            input.feedback ||
            `${current.title} has been approved and is awaiting a separate publication decision.`,
          actionUrl: `/creator/submissions/${id}`,
        },
      });
      await appendAuditLog(tx, {
        adminUserId: admin.id,
        action: `CREATOR_SUBMISSION_${input.decision}`,
        targetType: "FilmSubmissionVersion",
        targetId: version.id,
        reason: input.feedback,
        before: { status: current.status, version: version.version },
        after: { status: nextStatus, filmId },
        metadata: { requiredChanges: input.requiredChanges },
        ...auditRequestContext(request),
      });
      return submission;
    });
    return Response.json({ submission: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REVIEW_FAILED";
    return Response.json(
      { error: message },
      {
        status:
          message === "SUBMISSION_NOT_REVIEWABLE"
            ? 409
            : message === "AUTH_REQUIRED"
              ? 401
              : ["OWNER_REQUIRED", "NOT_AUTHORIZED"].includes(message)
                ? 403
                : 400,
      },
    );
  }
}
