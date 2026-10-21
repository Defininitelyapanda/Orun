import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { assertPublishable,cmsPageInput,hashPreviewToken,normalizeRedirectPath,workflowTransition } from "@/lib/cms/workflow";
import { roleAllows } from "@/lib/auth/permissions";

describe("CMS workflow",()=>{
 it("validates structured page sections",()=>{expect(cmsPageInput.parse({slug:"about-orun",title:"About Orun",sections:[{id:"hero",type:"hero",props:{title:"Story"}}]}).slug).toBe("about-orun");expect(()=>cmsPageInput.parse({slug:"About Orun",title:"A",sections:[]})).toThrow()});
 it("enforces review transitions and approval before publication",()=>{expect(workflowTransition("SUBMIT_REVIEW","DRAFT").reviewStatus).toBe("IN_REVIEW");expect(workflowTransition("APPROVE","IN_REVIEW").status).toBe("READY");expect(()=>workflowTransition("APPROVE","DRAFT")).toThrow("CMS_INVALID_TRANSITION");expect(()=>assertPublishable("IN_REVIEW")).toThrow("CMS_APPROVAL_REQUIRED")});
 it("hashes preview credentials and constrains redirects to local paths",()=>{expect(hashPreviewToken("secret")).not.toContain("secret");expect(normalizeRedirectPath("/old-page")).toBe("/old-page");expect(()=>normalizeRedirectPath("https://example.com")).toThrow("CMS_INVALID_REDIRECT")});
 it("gates publishing, scheduling and redirects with MFA and recent auth",()=>{const pageRoute=readFileSync("app/api/admin/cms/pages/[id]/route.ts","utf8"),redirectRoute=readFileSync("app/api/admin/cms/redirects/route.ts","utf8");expect(pageRoute).toContain("requireMfa:sensitive");expect(pageRoute).toContain("requireRecentAuth:sensitive");expect(redirectRoute).toContain("requireMfa:true");expect(redirectRoute).toContain("requireRecentAuth:true")});
 it("separates drafting from approval authority",()=>{expect(roleAllows("EDITOR","cms:write")).toBe(true);expect(roleAllows("EDITOR","cms:approve")).toBe(false);expect(roleAllows("CONTENT_ADMIN","cms:approve")).toBe(true)});
 it("keeps preview tokens hashed and expiring",()=>{const route=readFileSync("app/api/admin/cms/pages/[id]/preview/route.ts","utf8");expect(route).toContain("tokenHash");expect(route).toContain("expiresAt");expect(route).not.toContain("data:{pageId:id,token,")});
});
