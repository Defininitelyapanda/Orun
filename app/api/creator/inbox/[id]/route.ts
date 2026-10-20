import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError, messageInput, requireViewer } from "@/lib/film/feedback";

async function authorizedConversation(id: string) {
  const { session, profile } = await requireViewer();
  const conversation = await prisma.creatorConversation.findUnique({ where: { id }, include: { messages: { where: { status: "VISIBLE" }, orderBy: { createdAt: "asc" } } } });
  if (!conversation || (conversation.recipientUserId !== session.user.id && conversation.senderProfileId !== profile.id)) throw new Error("NOT_AUTHORIZED");
  return { conversation, session, profile };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { conversation, session } = await authorizedConversation((await params).id);
    const recipient = conversation.recipientUserId === session.user.id;
    await prisma.creatorConversation.update({ where: { id: conversation.id }, data: recipient ? { recipientReadAt: new Date() } : { senderReadAt: new Date() } });
    return Response.json(conversation);
  } catch (error) { return feedbackError(error); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { conversation, session } = await authorizedConversation((await params).id);
    assertRateLimit(`conversation:${session.user.id}`, 10, 60_000);
    const { body } = messageInput.parse(await request.json());
    const recipient = conversation.recipientUserId === session.user.id;
    const message = await prisma.creatorMessage.create({ data: { conversationId: conversation.id, senderUserId: session.user.id, body } });
    await prisma.creatorConversation.update({ where: { id: conversation.id }, data: recipient ? { senderReadAt: null, recipientReadAt: new Date(), senderArchivedAt: null } : { recipientReadAt: null, senderReadAt: new Date(), recipientArchivedAt: null } });
    return Response.json({ message }, { status: 201 });
  } catch (error) { return feedbackError(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { conversation, session } = await authorizedConversation((await params).id);
    const { archived, read } = z.object({ archived: z.boolean().optional(), read: z.boolean().optional() }).parse(await request.json());
    const creator = conversation.recipientUserId === session.user.id;
    const data = creator
      ? { ...(archived !== undefined && { recipientArchivedAt: archived ? new Date() : null }), ...(read !== undefined && { recipientReadAt: read ? new Date() : null }) }
      : { ...(archived !== undefined && { senderArchivedAt: archived ? new Date() : null }), ...(read !== undefined && { senderReadAt: read ? new Date() : null }) };
    return Response.json(await prisma.creatorConversation.update({ where: { id: conversation.id }, data }));
  } catch (error) { return feedbackError(error); }
}
