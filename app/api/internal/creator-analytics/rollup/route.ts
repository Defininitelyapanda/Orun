import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  calculateFilmMetrics,
  type PlaybackObservation,
} from "@/lib/creator/analytics";
import { secureTokenMatches } from "@/lib/operations/controls";

const propertiesSchema = z.object({
  filmId: z.string().min(1),
  playbackSessionId: z.string().min(1),
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive(),
});
export async function POST(request: Request) {
  try {
    if (
      !secureTokenMatches(
        process.env.ANALYTICS_ROLLUP_SECRET,
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          null,
      )
    )
      return Response.json({ error: "NOT_AUTHORIZED" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { day?: string },
      day = body.day
        ? new Date(`${body.day}T00:00:00.000Z`)
        : new Date(Date.now() - 86400000);
    day.setUTCHours(0, 0, 0, 0);
    if (Number.isNaN(day.getTime())) throw new Error("INVALID_DAY");
    const end = new Date(day.getTime() + 86400000);
    const events = await prisma.analyticsEvent.findMany({
      where: {
        name: "playback_progress",
        occurredAt: { gte: day, lt: end },
        userId: { not: null },
      },
      select: { userId: true, occurredAt: true, properties: true },
    });
    const privacy = await prisma.privacyPreference.findMany({
        where: {
          userId: {
            in: [
              ...new Set(
                events.map((item) => item.userId).filter(Boolean) as string[],
              ),
            ],
          },
          productAnalytics: true,
        },
        select: { userId: true },
      }),
      allowedUsers = new Set(privacy.map((item) => item.userId));
    const byFilm = new Map<string, PlaybackObservation[]>();
    for (const event of events) {
      if (!event.userId || !allowedUsers.has(event.userId)) continue;
      const parsed = propertiesSchema.safeParse(event.properties);
      if (!parsed.success) continue;
      const list = byFilm.get(parsed.data.filmId) ?? [];
      list.push({
        sessionId: parsed.data.playbackSessionId,
        occurredAt: event.occurredAt,
        positionSeconds: parsed.data.positionSeconds,
        durationSeconds: parsed.data.durationSeconds,
      });
      byFilm.set(parsed.data.filmId, list);
    }
    const existingFilms = new Set(
      (
        await prisma.film.findMany({
          where: { id: { in: [...byFilm.keys()] } },
          select: { id: true },
        })
      ).map((item) => item.id),
    );
    await prisma.$transaction(
      [...byFilm.entries()]
        .filter(([filmId]) => existingFilms.has(filmId))
        .map(([filmId, observations]) => {
          const metric = calculateFilmMetrics(observations);
          return prisma.creatorFilmAnalytics.upsert({
            where: { filmId_day: { filmId, day } },
            create: {
              filmId,
              day,
              qualifiedViews: metric.qualifiedViews,
              watchSeconds: BigInt(metric.watchSeconds),
              startedViews: metric.startedViews,
              completedViews: metric.completedViews,
            },
            update: {
              qualifiedViews: metric.qualifiedViews,
              watchSeconds: BigInt(metric.watchSeconds),
              startedViews: metric.startedViews,
              completedViews: metric.completedViews,
              generatedAt: new Date(),
            },
          });
        }),
    );
    return Response.json({
      day: day.toISOString().slice(0, 10),
      films: byFilm.size,
      eligibleEvents: [...byFilm.values()].reduce(
        (sum, list) => sum + list.length,
        0,
      ),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "CREATOR_ANALYTICS_ROLLUP_FAILED",
      },
      { status: 400 },
    );
  }
}
