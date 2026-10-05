import { randomBytes, timingSafeEqual } from "node:crypto";

export interface PasswordHasher { hash(password: string): Promise<string>; verify(hash: string, password: string): Promise<boolean> }
export class Pbkdf2PasswordHasher implements PasswordHasher {
  private iterations = 600_000;
  async hash(password: string) {
    const salt = randomBytes(16);
    const key = await this.derive(password, salt, this.iterations);
    return `pbkdf2-sha256$${this.iterations}$${salt.toString("base64url")}$${Buffer.from(key).toString("base64url")}`;
  }
  async verify(encoded: string, password: string) {
    const [algorithm, rounds, saltValue, hashValue] = encoded.split("$");
    if (algorithm !== "pbkdf2-sha256" || !rounds || !saltValue || !hashValue) return false;
    const expected = Buffer.from(hashValue, "base64url");
    const actual = Buffer.from(await this.derive(password, Buffer.from(saltValue, "base64url"), Number(rounds)));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  private derive(password: string, salt: Uint8Array, iterations: number) {
    return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]), 256);
  }
}
