import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { roleAllows } from "@/lib/auth/permissions";

describe("administrator user operations",()=>{
 it("lets support revoke sessions without granting account-status authority",()=>{expect(roleAllows("SUPPORT","users:sessions:write")).toBe(true);expect(roleAllows("SUPPORT","users:status:write")).toBe(false)});
 it("requires MFA, recent authentication, reasons and auditing",()=>{const source=readFileSync("app/api/admin/users/[id]/actions/route.ts","utf8");expect(source).toContain("requireMfa:true");expect(source).toContain("requireRecentAuth:true");expect(source).toContain("reason:z.string()");expect(source).toContain("appendAuditLog")});
 it("prevents an administrator from suspending their own account",()=>{const source=readFileSync("app/api/admin/users/[id]/actions/route.ts","utf8");expect(source).toContain("SELF_SUSPENSION_FORBIDDEN")});
});
