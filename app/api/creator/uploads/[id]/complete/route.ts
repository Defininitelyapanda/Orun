import { requireCreator } from "@/lib/creator/access";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); const { creator } = await requireCreator(), { id } = await params, asset = await prisma.mediaAsset.findUnique({ where: { id }, include: { submissionVersion: { include: { submission: true } } } });
    if (!asset?.submissionVersion || asset.submissionVersion.submission.creatorProfileId !== creator.id) throw new Error("ASSET_NOT_FOUND");
    await prisma.$transaction(async tx => { await tx.mediaAsset.update({ where: { id }, data: { status: "VALIDATING" } }); await tx.ingestionJob.create({ data: { mediaAssetId: id, sourceType: "PRIVATE_CREATOR_UPLOAD", status: "QUEUED", stage: "SCANNING" } }); await tx.creatorProfile.update({ where: { id: creator.id }, data: { usedUploadBytes: { increment: asset.sizeBytes } } }); await tx.filmSubmission.update({ where: { id: asset.submissionVersion!.submissionId }, data: { status: "PROCESSING", processingStatus: "VALIDATING" } }); });
    return Response.json({ ok: true, processingStatus: "VALIDATING" });
  } catch (error) { const message = error instanceof Error ? error.message : "UPLOAD_COMPLETE_FAILED"; return Response.json({ error: message }, { status: message === "ASSET_NOT_FOUND" ? 404 : message === "AUTH_REQUIRED" ? 401 : 403 }); }
}
