import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError, requireViewer } from "@/lib/film/feedback";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { profile } = await requireViewer();
    const commentId = (await params).id;
    const existing = await prisma.commentLike.findUnique({ where: { commentId_profileId: { commentId, profileId: profile.id } } });
    await prisma.$transaction(async transaction => {
      if (existing) {
        await transaction.commentLike.delete({ where: { commentId_profileId: { commentId, profileId: profile.id } } });
        await transaction.comment.update({ where: { id: commentId }, data: { helpfulCount: { decrement: 1 } } });
      } else {
        await transaction.commentLike.create({ data: { commentId, profileId: profile.id } });
        await transaction.comment.update({ where: { id: commentId }, data: { helpfulCount: { increment: 1 } } });
      }
    });
    return Response.json({ helpful: !existing });
  } catch (error) { return feedbackError(error); }
}
