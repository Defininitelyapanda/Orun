import { z } from "zod";
import { currentAuthSession } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";
import { invitationIsUsable, invitationTokenHash, normalizeInvitationEmail } from "@/lib/creator/invitations";

const schema = z.object({ displayName: z.string().trim().min(2).max(160), productionCompany: z.string().trim().max(200).optional(), biography: z.string().trim().max(2000).optional(), websiteUrl: z.string().url().max(500).optional().or(z.literal("")), countryCode: z.string().length(2).optional(), acceptTerms: z.literal(true), acceptContentTerms: z.literal(true) });
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request); const session = await currentAuthSession(); if (!session) throw new Error("AUTH_REQUIRED"); assertRateLimit(`creator-invite-accept:${session.userId}`, 8, 60 * 60_000);
    const input = schema.parse(await request.json()), { token } = await params, invitation = await prisma.creatorInvitation.findUnique({ where: { tokenHash: invitationTokenHash(token) } });
    if (!invitation || !invitationIsUsable(invitation, token)) throw new Error("INVITATION_INVALID");
    if (!session.user.email || !session.user.emailVerifiedAt || normalizeInvitationEmail(session.user.email) !== invitation.email) throw new Error("INVITED_EMAIL_REQUIRED");
    const now = new Date();
    const creator = await prisma.$transaction(async tx => {
      const profile = await tx.creatorProfile.upsert({ where: { userId: session.userId }, create: { userId: session.userId, displayName: input.displayName, productionCompany: input.productionCompany, biography: input.biography, websiteUrl: input.websiteUrl || null, countryCode: input.countryCode?.toUpperCase(), termsAcceptedAt: now, contentTermsAcceptedAt: now }, update: { displayName: input.displayName, productionCompany: input.productionCompany, biography: input.biography, websiteUrl: input.websiteUrl || null, countryCode: input.countryCode?.toUpperCase(), termsAcceptedAt: now, contentTermsAcceptedAt: now, accessStatus: "PENDING_APPROVAL" } });
      await tx.creatorInvitation.update({ where: { id: invitation.id }, data: { status: "PENDING_APPROVAL", tokenHash: null, acceptedAt: now, acceptedUserId: session.userId } });
      await tx.creatorNotification.create({ data: { creatorProfileId: profile.id, type: "INVITATION_ACCEPTED", title: "Application received", body: "Your filmmaker profile is awaiting final owner approval." } });
      return profile;
    });
    return Response.json({ creator, status: "PENDING_APPROVAL" });
  } catch (error) { const message = error instanceof Error ? error.message : "INVITATION_ACCEPT_FAILED"; return Response.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : message === "INVITATION_INVALID" ? 410 : message === "INVITED_EMAIL_REQUIRED" ? 403 : message === "RATE_LIMITED" ? 429 : 400 }); }
}
