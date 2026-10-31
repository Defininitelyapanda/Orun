import { z } from "zod";
import { requireOwner } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { appendAuditLog, auditRequestContext } from "@/lib/admin/audit";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";
import { createInvitationToken, deliverCreatorInvitation, invitationEmailHash, invitationLifetimeMs, normalizeInvitationEmail } from "@/lib/creator/invitations";

const schema = z.object({ email: z.string().email().max(320), intendedName: z.string().trim().max(160).optional(), productionCompany: z.string().trim().max(200).optional() });

export async function GET() {
  try { await requireOwner(); return Response.json({ invitations: await prisma.creatorInvitation.findMany({ orderBy: { createdAt: "desc" }, take: 200 }) }); }
  catch (error) { const message = error instanceof Error ? error.message : "INVITATIONS_FAILED"; return Response.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 403 }); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const { admin } = await requireOwner(); assertRateLimit(`creator-invite:${admin.id}`, 20, 60 * 60_000);
    const input = schema.parse(await request.json()), email = normalizeInvitationEmail(input.email), { token, tokenHash } = createInvitationToken(), now = new Date(), expiresAt = new Date(now.getTime() + invitationLifetimeMs);
    const invitation = await prisma.$transaction(async tx => {
      const created = await tx.creatorInvitation.create({ data: { email, emailHash: invitationEmailHash(email), tokenHash, intendedName: input.intendedName, productionCompany: input.productionCompany, status: "SENT", sentAt: now, expiresAt, invitedByAdminId: admin.id } });
      await appendAuditLog(tx, { adminUserId: admin.id, action: "CREATOR_INVITATION_SENT", targetType: "CreatorInvitation", targetId: created.id, after: { emailHash: created.emailHash, status: created.status, expiresAt }, ...auditRequestContext(request) });
      return created;
    });
    const delivered = await deliverCreatorInvitation({ email, token, origin: new URL(request.url).origin }).catch(() => false);
    const acceptUrl = new URL(`/creator/invite/${encodeURIComponent(token)}`, request.url).toString();
    return Response.json({ invitation, delivered, acceptUrl }, { status: 201 });
  } catch (error) { const message = error instanceof Error ? error.message : "INVITATION_CREATE_FAILED"; return Response.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : ["OWNER_REQUIRED", "NOT_AUTHORIZED"].includes(message) ? 403 : message === "RATE_LIMITED" ? 429 : 400 }); }
}
