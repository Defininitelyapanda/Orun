import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { p2pEventInputSchema } from "@/lib/p2p/validation";
import { requestIdentity } from "@/server/services/request-identity-service";
import { safeError } from "@/server/services/p2p-service";

const statusByEvent = { READY: "READY", BUFFERING_STARTED: "BUFFERING", FIRST_FRAME: "PLAYING", COMPLETED: "COMPLETED", FAILED: "FAILED", CANCELLED: "CANCELLED", FALLBACK: "FALLBACK" } as const;

export async function POST(request: Request) {
  const user = await requestIdentity(request);
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const input = p2pEventInputSchema.parse(await request.json());
    const session = await prisma.p2PPlaybackSession.findFirst({ where: { id: input.sessionId, userId: user.id } });
    if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
    const status = statusByEvent[input.type as keyof typeof statusByEvent];
    const terminal = ["COMPLETED", "FAILED", "CANCELLED", "FALLBACK"].includes(status ?? "");
    await prisma.$transaction([
      prisma.p2PPlaybackEvent.create({ data: {
        sessionId: input.sessionId, type: input.type, progress: input.progress, peerCount: input.peerCount,
        bytesFromPeers: input.bytesFromPeers === undefined ? undefined : BigInt(input.bytesFromPeers), bytesFromOrigin: input.bytesFromOrigin === undefined ? undefined : BigInt(input.bytesFromOrigin),
        durationMs: input.durationMs, failureCategory: input.failureCategory, details: input.details,
      } }),
      prisma.p2PPlaybackSession.update({ where: { id: input.sessionId }, data: {
        status, peerCount: input.peerCount, failureCategory: input.failureCategory,
        timeToFirstFrameMs: input.type === "FIRST_FRAME" ? input.durationMs : undefined,
        playbackDurationMs: input.type === "PROGRESS" ? input.durationMs : undefined,
        bufferingDurationMs: input.type === "BUFFERING_ENDED" && input.durationMs ? { increment: input.durationMs } : undefined,
        fallbackUsed: input.type === "FALLBACK" ? true : undefined,
        endedAt: terminal ? new Date() : undefined,
      } }),
    ]);
    return Response.json({ recorded: true }, { status: 201 });
  } catch (error) { return Response.json({ error: safeError(error) }, { status: error instanceof z.ZodError ? 422 : 500 }); }
}
