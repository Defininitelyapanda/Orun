import { prisma } from "@/lib/db/prisma";
import { requireP2PAdmin } from "@/server/services/request-identity-service";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  const actor = await requireP2PAdmin(request);
  if (!actor) return Response.json({ error: "Administrator permission required" }, { status: 403 });
  const sessions = await prisma.p2PPlaybackSession.findMany({ orderBy: { startedAt: "desc" }, take: 10_000 });
  const header = ["session_id", "content_id", "delivery_method", "browser", "device", "source_status", "time_to_first_frame_ms", "playback_duration_ms", "buffering_duration_ms", "failure_category", "fallback_outcome", "bytes_from_peers", "bytes_from_origin", "started_at"];
  const rows = sessions.map((item) => [item.id, item.filmId, item.deliveryMethod, item.browserCategory, item.deviceCategory, item.sourceStatus, item.timeToFirstFrameMs, item.playbackDurationMs, item.bufferingDurationMs, item.failureCategory, item.fallbackOutcome, item.bytesFromPeers, item.bytesFromOrigin, item.startedAt.toISOString()].map(csv).join(","));
  return new Response([header.join(","), ...rows].join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=orun-p2p-diagnostics.csv", "cache-control": "no-store" } });
}
