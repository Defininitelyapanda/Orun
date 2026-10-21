import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

describe("control-centre routing",()=>{
 it("uses permission-scoped nested operation routes",()=>{
  const page=readFileSync("app/admin/[section]/page.tsx","utf8");
  expect(page).toContain('users:"users:read"');
  expect(page).toContain('payments:"payments:read"');
  expect(page).toContain("requireAdmin(sections[section])");
 });
 it("filters navigation using the central permission matrix",()=>{
  const sidebar=readFileSync("components/admin/admin-sidebar.tsx","utf8");
  expect(sidebar).toContain("anyRoleAllows");
  expect(sidebar).not.toContain("/admin?view=");
 });
 it("redacts sensitive platform settings",()=>{
  const page=readFileSync("app/admin/[section]/page.tsx","utf8");
  expect(page).toContain("[REDACTED]");
 });
 it("limits global search to assigned permissions",()=>{
  const search=readFileSync("app/admin/search/page.tsx","utf8");
  expect(search).toContain('anyRoleAllows(roles,"users:read")');
  expect(search).toContain('anyRoleAllows(roles,"payments:read")');
 });
});
