import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError, ratingInput, refreshRatingAggregate, requireViewer, resolvePublishedFilm } from "@/lib/film/feedback";

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const film = await resolvePublishedFilm((await params).slug);
    if (!film.ratingsEnabled) return Response.json({ average: 0, count: 0, distribution: {}, ownRating: null, enabled: false });
    const aggregate = await prisma.filmRatingAggregate.findUnique({ where: { filmId: film.id } });
    let ownRating: number | null = null;
    try {
      const { profile } = await requireViewer();
      ownRating = (await prisma.rating.findUnique({ where: { profileId_filmId: { profileId: profile.id, filmId: film.id } } }))?.value ?? null;
    } catch { /* Public summaries do not require authentication. */ }
    return Response.json({ average: aggregate?.average ?? 0, count: aggregate?.count ?? 0, distribution: aggregate?.distribution ?? {}, ownRating, enabled: true });
  } catch (error) { return feedbackError(error); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    assertSameOrigin(request);
    const { session, profile } = await requireViewer();
    assertRateLimit(`rating:${session.user.id}`, 15, 60_000);
    const film = await resolvePublishedFilm((await params).slug);
    if (!film.ratingsEnabled) throw new Error("RATINGS_DISABLED");
    const { value } = ratingInput.parse(await request.json());
    await prisma.rating.upsert({ where: { profileId_filmId: { profileId: profile.id, filmId: film.id } }, create: { profileId: profile.id, filmId: film.id, value }, update: { value, active: true } });
    return Response.json(await refreshRatingAggregate(film.id));
  } catch (error) { return feedbackError(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    assertSameOrigin(request);
    const { profile } = await requireViewer();
    const film = await resolvePublishedFilm((await params).slug);
    if (!film.ratingsEnabled) throw new Error("RATINGS_DISABLED");
    await prisma.rating.updateMany({ where: { profileId: profile.id, filmId: film.id }, data: { active: false } });
    return Response.json(await refreshRatingAggregate(film.id));
  } catch (error) { return feedbackError(error); }
}
