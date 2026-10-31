import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { requireOwnedSubmission } from "@/lib/creator/access";
import { nextRevision } from "@/lib/creator/workflow";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

const schema = z.object({ metadata: z.record(z.string(), z.unknown()).refine(value => typeof value.title === "string" && value.title.trim().length > 0, "Title is required."), rightsDeclaration: z.record(z.string(), z.unknown()), accessibility: z.record(z.string(), z.unknown()).optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); const { id } = await params, { submission, session } = await requireOwnedSubmission(id), input = schema.parse(await request.json()), current = submission.versions[0]; if (!current) throw new Error("VERSION_NOT_FOUND");
    const immutableReviewState = ["PENDING_REVIEW", "APPROVED", "PUBLISHED", "UNPUBLISHED", "REJECTED"].includes(submission.status), versionNumber = immutableReviewState ? nextRevision(submission.currentVersionNumber) : submission.currentVersionNumber;
    const updated = await prisma.$transaction(async tx => {
      const version = immutableReviewState ? await tx.filmSubmissionVersion.create({ data: { submissionId: id, version: versionNumber, metadata: input.metadata as Prisma.InputJsonValue, rightsDeclaration: input.rightsDeclaration as Prisma.InputJsonValue, accessibility: input.accessibility as Prisma.InputJsonValue | undefined, createdByUserId: session.userId } }) : await tx.filmSubmissionVersion.update({ where: { id: current.id }, data: { metadata: input.metadata as Prisma.InputJsonValue, rightsDeclaration: input.rightsDeclaration as Prisma.InputJsonValue, accessibility: input.accessibility as Prisma.InputJsonValue | undefined } });
      const saved = await tx.filmSubmission.update({ where: { id }, data: { title: String(input.metadata.title), status: "DRAFT", processingStatus: immutableReviewState ? "NOT_STARTED" : submission.processingStatus, currentVersionNumber: versionNumber } }); return { submission: saved, version };
    });
    return Response.json(updated);
  } catch (error) { const message = error instanceof Error ? error.message : "SUBMISSION_UPDATE_FAILED"; return Response.json({ error: message }, { status: message === "SUBMISSION_NOT_FOUND" ? 404 : message === "AUTH_REQUIRED" ? 401 : message.startsWith("CREATOR_") ? 403 : 400 }); }
}
