import { z } from "zod";

export const identifierKindSchema = z.enum(["email", "phone", "username"]);
export type IdentifierKind = z.infer<typeof identifierKindSchema>;

const emailSchema = z.string().email().max(320);
const usernameSchema = z.string().min(3).max(30).regex(/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/, "Use 3–30 letters, numbers, dots or underscores");
const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/, "Use international format, for example +254712345678");

export function normalizeIdentifier(value: string, requestedKind?: IdentifierKind) {
  const trimmed = value.trim();
  const kind = requestedKind ?? (trimmed.includes("@") ? "email" : trimmed.startsWith("+") ? "phone" : "username");
  const normalized = kind === "phone" ? trimmed.replace(/[\s()-]/g, "") : trimmed.toLowerCase();
  if (kind === "email") emailSchema.parse(normalized);
  else if (kind === "phone") phoneSchema.parse(normalized);
  else usernameSchema.parse(normalized);
  return { kind, normalized };
}

export function maskedIdentifier(identifier: string) {
  const { kind, normalized } = normalizeIdentifier(identifier);
  if (kind === "email") {
    const [local, domain] = normalized.split("@");
    return `${local?.slice(0, 2) ?? ""}***@${domain}`;
  }
  if (kind === "phone") return `${normalized.slice(0, 4)}••••${normalized.slice(-3)}`;
  return `${normalized.slice(0, 2)}***`;
}
