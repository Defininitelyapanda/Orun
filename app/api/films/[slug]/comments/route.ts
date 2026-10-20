import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";
import { commentInput, feedbackError, requireViewer, resolvePublishedFilm } from "@/lib/film/feedback";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const film = await resolvePublishedFilm((await params).slug);
    const sort = request.nextUrl.searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
    const take = 10;
    const comments = await prisma.comment.findMany({
      where: { filmId: film.id, status: "PUBLISHED", parentId: null },
      orderBy: sort === "helpful" ? [{ pinned: "desc" }, { helpfulCount: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    });
    const ids = comments.map((comment) => comment.id);
    const [profiles, replies, total] = await Promise.all([
      prisma.profile.findMany({ where: { id: { in: comments.map((comment) => comment.profileId) } }, select: { id: true, name: true, avatarUrl: true } }),
      prisma.comment.findMany({ where: { parentId: { in: ids }, status: "PUBLISHED" }, orderBy: { createdAt: "asc" } }),
      prisma.comment.count({ where: { filmId: film.id, status: "PUBLISHED", parentId: null } }),
    ]);
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
    return Response.json({
      items: comments.map((comment) => ({ ...comment, author: profileMap.get(comment.profileId) ?? { name: "ORUN viewer", avatarUrl: null }, helpful: comment.helpfulCount, replies: replies.filter((reply) => reply.parentId === comment.id) })),
      page,
      hasMore: page * take < total,
    });
  } catch (error) { return feedbackError(error); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    assertSameOrigin(request);
    const { session, profile } = await requireViewer();
    assertRateLimit(`comment:${session.user.id}`, 5, 60_000);
    const film = await resolvePublishedFilm((await params).slug);
    const input = commentInput.parse(await request.json());
    const comment = await prisma.comment.create({ data: { filmId: film.id, profileId: profile.id, body: input.body } });
    return Response.json({ comment }, { status: 201 });
  } catch (error) { return feedbackError(error); }
}
