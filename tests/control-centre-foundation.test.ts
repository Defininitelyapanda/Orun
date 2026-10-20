import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { inspectEnvironment } from "@/lib/config/environment";
import { roleAllows,rolePermissions } from "@/lib/auth/permissions";

describe("control-centre foundation",()=>{
 it("fails production configuration when critical runtime values are absent",()=>{
  const report=inspectEnvironment({NODE_ENV:"production"} as NodeJS.ProcessEnv);
  expect(report.valid).toBe(false);
  expect(report.missing).toEqual(expect.arrayContaining(["DATABASE_URL","PLAYBACK_SIGNING_SECRET","CDN_URL","AUTH_SECRET"]));
 });
 it("keeps privileged permissions centralized",()=>{
  expect(roleAllows("OWNER","anything:dangerous")).toBe(true);
  expect(roleAllows("ANALYST","payments:write")).toBe(false);
  expect(rolePermissions.FINANCE).toContain("payments:write");
 });
 it("does not trust caller-provided identity for playback",()=>{
  const source=readFileSync("app/api/playback/authorize/route.ts","utf8");
  expect(source).not.toContain("x-orun-user-id");
  expect(source).toContain("currentAuthSession");
  expect(source).toContain("PlaybackAuthorizationService");
 });
 it("protects the admin route on the server",()=>{
  const source=readFileSync("app/admin/layout.tsx","utf8");
  expect(source).toContain("requireAdmin");
  expect(source).toContain("redirect");
 });
 it("enforces append-only audit records in the migration",()=>{
  const migration=readFileSync("prisma/migrations/20261020210000_control_centre_foundation/migration.sql","utf8");
  expect(migration).toContain("orun_reject_audit_mutation");
  expect(migration).toContain("BEFORE UPDATE OR DELETE");
 });
});
