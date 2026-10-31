import { z } from "zod";
import { requireOwner } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { appendAuditLog, auditRequestContext } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { assertPublishable } from "@/lib/creator/workflow";

const schema = z.object({ action: z.enum(["PUBLISH", "UNPUBLISH"]), reason: z.string().trim().max(1000).optional() });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); const { admin } = await requireOwner(), input = schema.parse(await request.json()), { id } = await params, current = await prisma.filmSubmission.findUnique({ where: { id }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
    if (!current?.filmId) throw new Error("APPROVED_FILM_REQUIRED"); const version = current.versions[0]; if (!version) throw new Error("VERSION_NOT_FOUND"); const now = new Date();
    if (input.action === "PUBLISH") assertPublishable({ submissionStatus: current.status, processingStatus: version.processingStatus, currentVersion: current.currentVersionNumber, approvedVersion: version.version, approvedAt: version.approvedAt });
    if (input.action === "UNPUBLISH" && current.status !== "PUBLISHED") throw new Error("FILM_NOT_PUBLISHED");
    const submission = await prisma.$transaction(async tx => {
      const publish = input.action === "PUBLISH"; await tx.film.update({ where: { id: current.filmId! }, data: { status: publish ? "PUBLISHED" : "READY", access: publish ? "PREMIUM" : "ADMIN_ONLY", publishedAt: publish ? now : null } });
      const saved = await tx.filmSubmission.update({ where: { id }, data: { status: publish ? "PUBLISHED" : "UNPUBLISHED" } });
      await tx.filmPublicationRecord.create({ data: { filmId: current.filmId!, versionId: version.id, action: publish ? "PUBLISHED" : "UNPUBLISHED", reason: input.reason, performedByAdminId: admin.id } });
      await tx.creatorNotification.create({ data: { creatorProfileId: current.creatorProfileId, type: publish ? "FILM_PUBLISHED" : "FILM_UNPUBLISHED", title: publish ? "Film published" : "Film unpublished", body: publish ? `${current.title} is now available on ORUN.` : `${current.title} has been removed from public discovery and playback.${input.reason ? ` ${input.reason}` : ""}`, actionUrl: `/creator/films` } });
      await appendAuditLog(tx, { adminUserId: admin.id, action: `CREATOR_FILM_${input.action}ED`, targetType: "Film", targetId: current.filmId!, reason: input.reason, before: { submissionStatus: current.status }, after: { submissionStatus: saved.status, versionId: version.id }, ...auditRequestContext(request) }); return saved;
    });
    return Response.json({ submission });
  } catch (error) { const message = error instanceof Error ? error.message : "PUBLICATION_FAILED"; return Response.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : ["OWNER_REQUIRED", "NOT_AUTHORIZED"].includes(message) ? 403 : ["SUBMISSION_NOT_APPROVED", "EXACT_VERSION_NOT_APPROVED", "FILM_NOT_PUBLISHED"].includes(message) ? 409 : 400 }); }
}
