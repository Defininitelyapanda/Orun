import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { currentAuthSession } from "@/lib/auth/session-cookie";

export const commentInput = z.object({ body: z.string().trim().min(2).max(2000) });
export const messageInput = z.object({ body: z.string().trim().min(2).max(2000) });
export const ratingInput = z.object({ value: z.number().int().min(1).max(5) });

export async function requireViewer() {
  const session = await currentAuthSession();
  const profile = session?.user.profiles[0];
  if (!session || !profile) throw new Error("AUTH_REQUIRED");
  return { session, profile };
}

export async function resolvePublishedFilm(slug: string) {
  const film = await prisma.film.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!film) throw new Error("FILM_NOT_FOUND");
  return film;
}

export async function refreshRatingAggregate(filmId: string) {
  const [stats, groups] = await Promise.all([
    prisma.rating.aggregate({ where: { filmId, active: true }, _avg: { value: true }, _count: { value: true } }),
    prisma.rating.groupBy({ by: ["value"], where: { filmId, active: true }, _count: { value: true } }),
  ]);
  const average = stats._avg.value ?? 0;
  const count = stats._count.value;
  const priorMean = 3.5;
  const priorWeight = 10;
  const bayesianScore = count ? (average * count + priorMean * priorWeight) / (count + priorWeight) : 0;
  const distribution = Object.fromEntries([1, 2, 3, 4, 5].map((value) => [value, groups.find((group) => group.value === value)?._count.value ?? 0]));
  return prisma.filmRatingAggregate.upsert({
    where: { filmId },
    create: { filmId, average, count, distribution, bayesianScore },
    update: { average, count, distribution, bayesianScore },
  });
}

export function feedbackError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  const status = message === "AUTH_REQUIRED" ? 401
    : ["FILM_NOT_FOUND", "COMMENT_NOT_FOUND"].includes(message) ? 404
      : message === "RATE_LIMITED" ? 429
        : ["INVALID_ORIGIN", "NOT_AUTHORIZED"].includes(message) ? 403
          : ["PRIVATE_MESSAGES_DISABLED", "MESSAGING_UNAVAILABLE", "COMMENTS_DISABLED", "RATINGS_DISABLED", "TRAILERS_DISABLED"].includes(message) ? 409
            : 400;
  return Response.json({ error: message }, { status });
}
