import { currentAuthSession } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { assertRateLimit, assertSameOrigin } from "@/lib/security/request-guards";

export async function GET() {
  const current = await currentAuthSession();
  if (!current) return Response.json({ error: "Authentication required" }, { status: 401 });
  const requests = await prisma.dataExportRequest.findMany({
    where: { userId: current.userId }, orderBy: { createdAt: "desc" }, take: 10,
    select: { id: true, status: true, createdAt: true, completedAt: true, expiresAt: true, failureReason: true },
  });
  return Response.json(requests, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const current = await currentAuthSession();
    if (!current) return Response.json({ error: "Authentication required" }, { status: 401 });
    assertRateLimit(`export:${current.userId}`, 1, 24 * 60 * 60_000);
    const existing = await prisma.dataExportRequest.findFirst({ where: { userId: current.userId, status: { in: ["REQUESTED", "PROCESSING"] } } });
    if (existing) return Response.json(existing, { status: 202 });
    const created = await prisma.dataExportRequest.create({ data: { userId: current.userId } });
    await prisma.privacyAuditEvent.create({ data: { userId: current.userId, action: "DATA_EXPORT_REQUESTED", category: "data_export" } });
    return Response.json(created, { status: 202 });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") return Response.json({ error: "Only one export request is allowed per day" }, { status: 429 });
    return Response.json({ error: "Export could not be requested" }, { status: 422 });
  }
}
