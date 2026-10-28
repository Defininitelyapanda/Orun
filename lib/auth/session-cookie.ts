import { cookies } from "next/headers";
import { hashToken } from "./tokens";
import { prisma } from "@/lib/db/prisma";

export async function currentAuthSession() {
  const token = (await cookies()).get("orun_session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { profiles: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") return null;
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  return session;
}

export async function currentUser() {
  const session = await currentAuthSession();
  if (!session) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email, username: session.user.username, phoneNumber: session.user.phoneNumber };
}
