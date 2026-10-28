import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeIdentifier } from "../lib/auth/identifiers";
import { Pbkdf2PasswordHasher } from "../lib/auth/passwords";
import { sessionLifetimeMs } from "../server/services/auth-service";

describe("multi-identifier authentication", () => {
  it("normalizes email, phone and username identifiers", () => {
    expect(normalizeIdentifier(" Person@Example.COM ")).toEqual({ kind: "email", normalized: "person@example.com" });
    expect(normalizeIdentifier("+254 712 345 678")).toEqual({ kind: "phone", normalized: "+254712345678" });
    expect(normalizeIdentifier(" Cinema.Fan ")).toEqual({ kind: "username", normalized: "cinema.fan" });
    expect(normalizeIdentifier("2026viewer")).toEqual({ kind: "username", normalized: "2026viewer" });
  });

  it("rejects ambiguous or unsafe usernames", () => {
    expect(() => normalizeIdentifier("../admin", "username")).toThrow();
    expect(() => normalizeIdentifier("07-local-number", "phone")).toThrow();
  });

  it("hashes passwords with unique salts and verifies without retaining plaintext", async () => {
    const hasher = new Pbkdf2PasswordHasher();
    const first = await hasher.hash("Correct Horse Battery Staple");
    const second = await hasher.hash("Correct Horse Battery Staple");
    expect(first).not.toBe(second);
    expect(first).not.toContain("Correct Horse");
    expect(await hasher.verify(first, "Correct Horse Battery Staple")).toBe(true);
    expect(await hasher.verify(first, "wrong password")).toBe(false);
  });

  it("uses shorter browser sessions unless remember me is selected", () => {
    expect(sessionLifetimeMs(false)).toBe(12 * 60 * 60_000);
    expect(sessionLifetimeMs(true)).toBe(30 * 24 * 60 * 60_000);
  });
});

describe("password-manager form contract", () => {
  it("declares standard autocomplete tokens and stable field names", () => {
    const registration = readFileSync(new URL("../components/auth/registration-form.tsx", import.meta.url), "utf8");
    const login = readFileSync(new URL("../app/auth/login/page.tsx", import.meta.url), "utf8");
    const verify = readFileSync(new URL("../app/auth/verify/page.tsx", import.meta.url), "utf8");
    expect(registration).toContain('name="identifier"');
    expect(registration).toContain('autoComplete="username"');
    expect(registration.match(/autoComplete="new-password"/g)).toHaveLength(2);
    expect(login).toContain('autoComplete="username"');
    expect(login).toContain('autoComplete="current-password"');
    expect(verify).toContain('autoComplete="one-time-code"');
  });
});
