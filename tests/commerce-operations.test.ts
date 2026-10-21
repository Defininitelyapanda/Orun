import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { roleAllows } from "@/lib/auth/permissions";
import { reconciliationStatus,refundWorkflowFromProvider } from "@/lib/payments/operations";
describe("commerce operations",()=>{
 it("detects provider reconciliation mismatches",()=>{const local={status:"SUCCEEDED",amount:50000n,currency:"KES"};expect(reconciliationStatus(local,{status:"SUCCEEDED",amount:50000n,currency:"KES"})).toBe("MATCHED");expect(reconciliationStatus(local,{status:"SUCCEEDED",amount:40000n,currency:"KES"})).toBe("MISMATCH");expect(reconciliationStatus(local,{status:"FAILED",amount:50000n,currency:"KES"})).toBe("MISMATCH")});
 it("maps provider refund states to workflow states",()=>{expect(refundWorkflowFromProvider("REFUNDED")).toBe("SUCCEEDED");expect(refundWorkflowFromProvider("PROCESSING")).toBe("PROCESSING");expect(refundWorkflowFromProvider("FAILED")).toBe("FAILED")});
 it("limits sensitive commerce permissions to finance roles",()=>{expect(roleAllows("FINANCE","refunds:approve")).toBe(true);expect(roleAllows("SUPPORT","refunds:approve")).toBe(false);expect(roleAllows("ANALYST","payments:reconcile")).toBe(false)});
 it("enforces independent refund approval and capped totals",()=>{const request=readFileSync("app/api/admin/payments/[id]/refunds/route.ts","utf8"),decision=readFileSync("app/api/admin/refunds/[id]/decision/route.ts","utf8");expect(request).toContain("REFUND_EXCEEDS_PAYMENT");expect(request).toContain('isolationLevel:"Serializable"');expect(decision).toContain("REFUND_SEPARATION_REQUIRED");expect(decision).toContain("requestedByAdminId===admin.id")});
 it("requires MFA, recent auth and auditing for money movement",()=>{for(const path of ["app/api/admin/payments/[id]/refunds/route.ts","app/api/admin/refunds/[id]/decision/route.ts","app/api/admin/refunds/[id]/execute/route.ts"]){const source=readFileSync(path,"utf8");expect(source).toContain("requireMfa:true");expect(source).toContain("requireRecentAuth:true");expect(source).toContain("appendAuditLog")}});
});
