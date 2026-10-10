import { prisma } from "@/lib/db/prisma";
import { requireP2PAdmin } from "@/server/services/request-identity-service";

export async function GET(request: Request) {
  const actor = await requireP2PAdmin(request);
  if (!actor) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const [sources, titles, attempts, successful, failed, fallback, frames, totals, recentSessions] = await Promise.all([
    prisma.p2PSource.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.p2PSource.findMany({ distinct: ["filmId"], select: { filmId: true } }),
    prisma.p2PPlaybackSession.count(), prisma.p2PPlaybackSession.count({ where: { status: { in: ["PLAYING", "COMPLETED"] } } }),
    prisma.p2PPlaybackSession.count({ where: { status: "FAILED" } }), prisma.p2PPlaybackSession.count({ where: { fallbackUsed: true } }),
    prisma.p2PPlaybackSession.findMany({ where: { timeToFirstFrameMs: { not: null } }, select: { timeToFirstFrameMs: true }, orderBy: { timeToFirstFrameMs: "asc" } }),
    prisma.p2PPlaybackSession.aggregate({ _sum: { bytesFromPeers: true, bytesFromOrigin: true } }),
    prisma.p2PPlaybackSession.findMany({
      take: 20,
      orderBy: { startedAt: "desc" },
      select: { id: true, filmId: true, deliveryMethod: true, browserCategory: true, deviceCategory: true, sourceStatus: true, timeToFirstFrameMs: true, playbackDurationMs: true, bufferingDurationMs: true, failureCategory: true, fallbackUsed: true, fallbackOutcome: true, startedAt: true },
    }),
  ]);
  const values = frames.map(({ timeToFirstFrameMs }) => timeToFirstFrameMs!).sort((a, b) => a - b);
  return Response.json({
    sources: Object.fromEntries(sources.map((item) => [item.status, item._count._all])), totalTitles: titles.length, attempts, successful,
    medianTimeToFirstFrameMs: values.length ? values[Math.floor(values.length / 2)] : null,
    failureRate: attempts ? failed / attempts : 0, fallbackRate: attempts ? fallback / attempts : 0,
    measuredBytesFromPeers: Number(totals._sum.bytesFromPeers ?? 0n), measuredBytesFromOrigin: Number(totals._sum.bytesFromOrigin ?? 0n),
    recentSessions,
  });
}
