import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireOwnedSubmission } from "@/lib/creator/access";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { createPrivateUploadUrl } from "@/lib/storage/private-upload";

const schema = z.object({ submissionId: z.string().min(1), kind: z.enum(["VIDEO", "AUDIO", "SUBTITLE", "POSTER", "BACKDROP", "TRAILER", "THUMBNAIL"]), filename: z.string().trim().min(1).max(255), contentType: z.string().min(3).max(120), sizeBytes: z.number().int().positive().max(25 * 1024 * 1024 * 1024) });
const allowed: Record<string, RegExp> = { VIDEO: /^video\/(mp4|quicktime|x-matroska)$/i, TRAILER: /^video\/(mp4|quicktime|x-matroska)$/i, AUDIO: /^audio\//i, SUBTITLE: /^(text\/(vtt|plain)|application\/(x-subrip|octet-stream))$/i, POSTER: /^image\/(jpeg|png|webp)$/i, BACKDROP: /^image\/(jpeg|png|webp)$/i, THUMBNAIL: /^image\/(jpeg|png|webp)$/i };
export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const input = schema.parse(await request.json()), { submission, creator } = await requireOwnedSubmission(input.submissionId), version = submission.versions[0]; if (!version) throw new Error("VERSION_NOT_FOUND");
    if (!allowed[input.kind].test(input.contentType)) throw new Error("UNSUPPORTED_MEDIA_TYPE"); if (creator.usedUploadBytes + BigInt(input.sizeBytes) > creator.uploadQuotaBytes) throw new Error("UPLOAD_QUOTA_EXCEEDED");
    const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120), key = `private/creators/${creator.id}/submissions/${submission.id}/v${version.version}/${randomUUID()}-${safeName}`;
    const uploadUrl = await createPrivateUploadUrl({ key, contentType: input.contentType, sizeBytes: input.sizeBytes });
    const asset = await prisma.mediaAsset.create({ data: { kind: input.kind, status: "UPLOADED", storageKey: key, sourceFilename: input.filename, contentType: input.contentType, sizeBytes: BigInt(input.sizeBytes), submissionVersionId: version.id, metadata: { visibility: "PRIVATE_UNAPPROVED", uploadTicketIssuedAt: new Date().toISOString() } } });
    await prisma.filmSubmission.update({ where: { id: submission.id }, data: { status: "UPLOADING", processingStatus: "UPLOADING" } });
    return Response.json({ assetId: asset.id, uploadUrl, expiresInSeconds: 900, headers: { "content-type": input.contentType }, visibility: "private" }, { status: 201 });
  } catch (error) { const message = error instanceof Error ? error.message : "UPLOAD_TICKET_FAILED"; return Response.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : message === "UPLOAD_QUOTA_EXCEEDED" ? 413 : message.startsWith("CREATOR_") || message === "NOT_AUTHORIZED" ? 403 : 400 }); }
}
