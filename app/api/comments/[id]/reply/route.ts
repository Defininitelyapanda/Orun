import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";
import { commentInput, feedbackError, requireViewer } from "@/lib/film/feedback";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { session, profile } = await requireViewer();
    assertRateLimit(`public-reply:${session.user.id}`, 8, 60_000);
    const parent = await prisma.comment.findFirst({ where: { id: (await params).id, status: "PUBLISHED", parentId: null } });
    if (!parent) throw new Error("COMMENT_NOT_FOUND");
    const recipient = await prisma.filmCreatorRecipient.findUnique({ where: { filmId: parent.filmId } });
    if (recipient?.userId !== session.user.id) throw new Error("NOT_AUTHORIZED");
    const { body } = commentInput.parse(await request.json());
    const reply = await prisma.comment.create({ data: { filmId: parent.filmId, profileId: profile.id, parentId: parent.id, body, creatorReply: true } });
    return Response.json({ reply }, { status: 201 });
  } catch (error) { return feedbackError(error); }
}
