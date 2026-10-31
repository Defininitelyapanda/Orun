import { requireCreator } from "@/lib/creator/access";
import { prisma } from "@/lib/db/prisma";
export async function GET(request: Request) {
  try {
    const { creator } = await requireCreator(), url = new URL(request.url), filmId = url.searchParams.get("filmId"), from = url.searchParams.get("from") ? new Date(`${url.searchParams.get("from")}T00:00:00.000Z`) : new Date(Date.now() - 30 * 86400000), to = url.searchParams.get("to") ? new Date(`${url.searchParams.get("to")}T23:59:59.999Z`) : new Date();
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to || to.getTime() - from.getTime() > 2 * 365 * 86400000) throw new Error("INVALID_DATE_RANGE");
    const grants = await prisma.creatorFilmPermission.findMany({ where: { creatorProfileId: creator.id, active: true, permissions: { has: "VIEW_ANALYTICS" }, ...(filmId ? { filmId } : {}) }, select: { filmId: true, film: { select: { title: true, slug: true } } } });
    if (filmId && !grants.some(item => item.filmId === filmId)) throw new Error("NOT_AUTHORIZED"); const filmIds = grants.map(item => item.filmId);
    const rows = filmIds.length ? await prisma.creatorFilmAnalytics.findMany({ where: { filmId: { in: filmIds }, day: { gte: from, lte: to } }, orderBy: { day: "asc" } }) : [];
    const totals = rows.reduce((sum, row) => ({ qualifiedViews: sum.qualifiedViews + row.qualifiedViews, watchSeconds: sum.watchSeconds + Number(row.watchSeconds), startedViews: sum.startedViews + row.startedViews, completedViews: sum.completedViews + row.completedViews }), { qualifiedViews: 0, watchSeconds: 0, startedViews: 0, completedViews: 0 });
    return Response.json({ range: { from, to }, films: grants, totals: { ...totals, completionRate: totals.startedViews ? totals.completedViews / totals.startedViews : 0 }, series: rows.map(row => ({ ...row, watchSeconds: Number(row.watchSeconds) })), definitions: { qualifiedView: "A distinct playback session reaching 30 seconds or 25% of runtime, whichever is lower.", watchTime: "Positive playback progress only; duplicate and overlapping heartbeats are excluded.", completionRate: "Distinct started sessions reaching at least 90% of runtime." } });
  } catch (error) { const message = error instanceof Error ? error.message : "ANALYTICS_FAILED"; return Response.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : message === "NOT_AUTHORIZED" || message.startsWith("CREATOR_") ? 403 : 400 }); }
}
