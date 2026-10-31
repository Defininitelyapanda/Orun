import { requireOwnedSubmission } from "@/lib/creator/access";
import { assertCreatorTransition } from "@/lib/creator/workflow";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); const { id } = await params, { submission, creator } = await requireOwnedSubmission(id), version = submission.versions[0]; if (!version) throw new Error("VERSION_NOT_FOUND");
    assertCreatorTransition(submission.status, "PENDING_REVIEW"); if (version.processingStatus !== "READY") throw new Error("MEDIA_NOT_READY");
    const now = new Date(), updated = await prisma.$transaction(async tx => { const saved = await tx.filmSubmission.update({ where: { id }, data: { status: "PENDING_REVIEW", processingStatus: "READY", submittedAt: now } }); await tx.filmSubmissionVersion.update({ where: { id: version.id }, data: { submittedAt: now } }); await tx.creatorNotification.create({ data: { creatorProfileId: creator.id, type: "SUBMISSION_RECEIVED", title: "Submission received", body: `${submission.title} is in the ORUN owner review queue.`, actionUrl: `/creator/submissions/${id}` } }); return saved; });
    return Response.json({ submission: updated });
  } catch (error) { const message = error instanceof Error ? error.message : "SUBMIT_FAILED"; return Response.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : message === "SUBMISSION_NOT_FOUND" ? 404 : message.startsWith("CREATOR_") || message === "NOT_AUTHORIZED" ? 403 : 409 }); }
}
