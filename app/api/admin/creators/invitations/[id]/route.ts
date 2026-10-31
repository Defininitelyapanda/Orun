import { z } from "zod";
import { requireOwner } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { appendAuditLog, auditRequestContext } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { createInvitationToken, deliverCreatorInvitation, invitationLifetimeMs } from "@/lib/creator/invitations";

const schema = z.object({ action: z.enum(["RESEND", "REVOKE", "APPROVE", "SUSPEND", "REACTIVATE"]), reason: z.string().trim().max(500).optional() });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); const { admin } = await requireOwner(), input = schema.parse(await request.json()), { id } = await params, current = await prisma.creatorInvitation.findUnique({ where: { id } });
    if (!current) throw new Error("INVITATION_NOT_FOUND");
    let token: string | undefined;
    const result = await prisma.$transaction(async tx => {
      if (input.action === "RESEND") { const generated = createInvitationToken(); token = generated.token; return tx.creatorInvitation.update({ where: { id }, data: { tokenHash: generated.tokenHash, status: "SENT", sentAt: new Date(), expiresAt: new Date(Date.now() + invitationLifetimeMs), revokedAt: null, resendCount: { increment: 1 } } }); }
      if (input.action === "REVOKE") return tx.creatorInvitation.update({ where: { id }, data: { status: "REVOKED", tokenHash: null, revokedAt: new Date() } });
      if (!current.acceptedUserId) throw new Error("INVITATION_NOT_ACCEPTED");
      const creator = await tx.creatorProfile.findUnique({ where: { userId: current.acceptedUserId } }); if (!creator) throw new Error("CREATOR_NOT_FOUND");
      const accessStatus = input.action === "APPROVE" || input.action === "REACTIVATE" ? "APPROVED" : "SUSPENDED";
      await tx.creatorProfile.update({ where: { id: creator.id }, data: { accessStatus, approvedAt: accessStatus === "APPROVED" ? new Date() : creator.approvedAt, approvedByAdminId: accessStatus === "APPROVED" ? admin.id : creator.approvedByAdminId, suspendedAt: accessStatus === "SUSPENDED" ? new Date() : null, suspensionReason: accessStatus === "SUSPENDED" ? input.reason : null } });
      await tx.session.updateMany({ where: { userId: current.acceptedUserId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.creatorNotification.create({ data: { creatorProfileId: creator.id, type: `CREATOR_${accessStatus}`, title: accessStatus === "APPROVED" ? "Filmmaker access approved" : "Filmmaker access suspended", body: accessStatus === "APPROVED" ? "Your private ORUN filmmaker workspace is ready." : "Your filmmaker access has been suspended. Contact ORUN support for assistance." } });
      return tx.creatorInvitation.update({ where: { id }, data: { status: accessStatus } });
    });
    await appendAuditLog(prisma, { adminUserId: admin.id, action: `CREATOR_INVITATION_${input.action}`, targetType: "CreatorInvitation", targetId: id, reason: input.reason, before: { status: current.status }, after: { status: result.status }, ...auditRequestContext(request) });
    if (token) await deliverCreatorInvitation({ email: current.email, token, origin: new URL(request.url).origin }).catch(() => false);
    return Response.json({ invitation: result, acceptUrl: token ? new URL(`/creator/invite/${encodeURIComponent(token)}`, request.url).toString() : undefined });
  } catch (error) { const message = error instanceof Error ? error.message : "INVITATION_ACTION_FAILED"; return Response.json({ error: message }, { status: message === "INVITATION_NOT_FOUND" ? 404 : ["OWNER_REQUIRED", "NOT_AUTHORIZED"].includes(message) ? 403 : 400 }); }
}
