import { NextResponse } from "next/server";
import { z } from "zod";
import { currentAuthSession } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/db/prisma";
import { assertSameOrigin } from "@/lib/security/request-guards";

const policyVersion = "2026-10-12";
const consentSchema = z.object({
  preferences: z.boolean(),
  analytics: z.boolean(),
  advertising: z.literal(false),
  regionCode: z.string().length(2).toUpperCase().nullable().default(null),
}).strict();

export async function GET(request: Request) {
  const raw = request.headers.get("cookie")?.match(/(?:^|; )orun_consent=([^;]+)/)?.[1];
  if (!raw) return Response.json({ policyVersion, preferences: false, analytics: false, advertising: false });
  try {
    return Response.json({ policyVersion, ...JSON.parse(decodeURIComponent(raw)) });
  } catch {
    return Response.json({ policyVersion, preferences: false, analytics: false, advertising: false });
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const consent = consentSchema.parse(await request.json());
    const session = await currentAuthSession();
    if (session) await prisma.cookieConsent.create({ data: { userId: session.userId, policyVersion, ...consent } });
    const response = NextResponse.json({ policyVersion, ...consent, recordedAt: new Date().toISOString() });
    response.cookies.set("orun_consent", JSON.stringify(consent), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 24 * 3600,
    });
    return response;
  } catch {
    return Response.json({ error: "Consent choices could not be saved" }, { status: 422 });
  }
}
