import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError, messageInput, requireViewer, resolvePublishedFilm } from "@/lib/film/feedback";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    assertSameOrigin(request);
    const { session, profile } = await requireViewer();
    assertRateLimit(`creator-message:${session.user.id}`, 4, 60_000);
    const film = await resolvePublishedFilm((await params).slug);
    const recipient = await prisma.filmCreatorRecipient.findUnique({ where: { filmId: film.id } });
    if (!film.privateMessagesEnabled || !recipient?.privateMessagesEnabled) throw new Error("PRIVATE_MESSAGES_DISABLED");
    if (recipient.userId === session.user.id) throw new Error("CANNOT_MESSAGE_SELF");
    const blocked = await prisma.userBlock.findFirst({ where: { OR: [{ blockerUserId: recipient.userId, blockedUserId: session.user.id }, { blockerUserId: session.user.id, blockedUserId: recipient.userId }] } });
    if (blocked) throw new Error("MESSAGING_UNAVAILABLE");
    const { body } = messageInput.parse(await request.json());
    const conversation = await prisma.creatorConversation.upsert({
      where: { filmId_senderProfileId_recipientUserId: { filmId: film.id, senderProfileId: profile.id, recipientUserId: recipient.userId } },
      create: { filmId: film.id, senderProfileId: profile.id, recipientUserId: recipient.userId, senderReadAt: new Date(), messages: { create: { senderUserId: session.user.id, body } } },
      update: { recipientArchivedAt: null, recipientReadAt: null, senderReadAt: new Date(), messages: { create: { senderUserId: session.user.id, body } } },
    });
    await prisma.notification.create({ data: { userId: recipient.userId, type: "CREATOR_MESSAGE", title: `New feedback on ${film.title}`, body: `${profile.name} sent you a private message.`, href: `/creator/messages/${conversation.id}` } });
    return Response.json({ conversationId: conversation.id }, { status: 201 });
  } catch (error) { return feedbackError(error); }
}
