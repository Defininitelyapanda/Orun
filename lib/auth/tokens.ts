import { createHash, createHmac, randomBytes } from "node:crypto";

export function createOpaqueToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashVerificationCode(code: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET_REQUIRED");
  return createHmac("sha256", secret ?? "orun-local-verification-key").update(code).digest("hex");
}
