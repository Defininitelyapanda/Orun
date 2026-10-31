import { createHash, randomBytes } from "node:crypto";
import { HttpEmailProvider } from "@/lib/email/email-provider";

export const invitationLifetimeMs = 7 * 24 * 60 * 60_000;
export const normalizeInvitationEmail = (email: string) => email.trim().toLowerCase();
export const invitationEmailHash = (email: string) => createHash("sha256").update(normalizeInvitationEmail(email)).digest("hex");
export const invitationTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export function createInvitationToken() { const token = randomBytes(32).toString("base64url"); return { token, tokenHash: invitationTokenHash(token) }; }
export function invitationIsUsable(invitation: { status: string; expiresAt: Date | null; tokenHash: string | null }, token: string, now = new Date()) {
  return invitation.status === "SENT" && Boolean(invitation.tokenHash) && Boolean(invitation.expiresAt && invitation.expiresAt > now) && invitation.tokenHash === invitationTokenHash(token);
}

export async function deliverCreatorInvitation(input: { email: string; token: string; origin: string }) {
  const { EMAIL_API_URL, EMAIL_API_KEY, EMAIL_FROM } = process.env;
  if (!EMAIL_API_URL || !EMAIL_API_KEY || !EMAIL_FROM) return false;
  const url = new URL(`/creator/invite/${encodeURIComponent(input.token)}`, input.origin);
  await new HttpEmailProvider(EMAIL_API_URL, EMAIL_API_KEY, EMAIL_FROM).send({
    to: input.email,
    subject: "Your private ORUN filmmaker invitation",
    text: `You have been invited to ORUN's filmmaker programme. Accept the single-use invitation at ${url}. It expires in 7 days.`,
    html: `<p>You have been invited to ORUN's filmmaker programme.</p><p><a href="${url}">Accept invitation</a></p><p>This single-use link expires in 7 days.</p>`,
  });
  return true;
}
