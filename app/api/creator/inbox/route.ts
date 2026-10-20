import { prisma } from "@/lib/db/prisma";
import { feedbackError, requireViewer } from "@/lib/film/feedback";

export async function GET() {
  try {
    const { session } = await requireViewer();
    const conversations = await prisma.creatorConversation.findMany({ where: { recipientUserId: session.user.id, recipientArchivedAt: null }, orderBy: { updatedAt: "desc" }, take: 50, include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } });
    const filmIds = [...new Set(conversations.map((conversation) => conversation.filmId))];
    const profileIds = [...new Set(conversations.map((conversation) => conversation.senderProfileId))];
    const [films, profiles] = await Promise.all([
      prisma.film.findMany({ where: { id: { in: filmIds } }, select: { id: true, slug: true, title: true } }),
      prisma.profile.findMany({ where: { id: { in: profileIds } }, select: { id: true, name: true, avatarUrl: true } }),
    ]);
    return Response.json({ items: conversations.map((conversation) => ({ ...conversation, film: films.find((film) => film.id === conversation.filmId), sender: profiles.find((profile) => profile.id === conversation.senderProfileId) })) });
  } catch (error) { return feedbackError(error); }
}
