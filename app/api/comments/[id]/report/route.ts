import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";
import { feedbackError, requireViewer } from "@/lib/film/feedback";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { session, profile } = await requireViewer();
    assertRateLimit(`report:${session.user.id}`, 5, 3_600_000);
    const { reason } = z.object({ reason: z.string().trim().min(3).max(250) }).parse(await request.json());
    const report = await prisma.commentReport.create({ data: { commentId: (await params).id, reporterProfileId: profile.id, reason } });
    return Response.json({ reportId: report.id }, { status: 201 });
  } catch (error) { return feedbackError(error); }
}
