import { createHash,randomBytes } from "node:crypto";
import { z } from "zod";
import { pageSectionsSchema } from "@/server/services/page-builder-service";

export const cmsPageInput=z.object({
 slug:z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
 title:z.string().trim().min(2).max(180),
 sections:pageSectionsSchema.max(100),
 changeNote:z.string().trim().max(500).optional(),
});
export const cmsPageUpdate=cmsPageInput.omit({slug:true}).partial().extend({
 action:z.enum(["SAVE_DRAFT","SUBMIT_REVIEW","APPROVE","PUBLISH","SCHEDULE","RESTORE_REVISION"]),
 scheduledAt:z.string().datetime().optional(),
 revisionVersion:z.number().int().positive().optional(),
});

const transitions={
 SAVE_DRAFT:{reviewStatus:"DRAFT",status:"DRAFT"},
 SUBMIT_REVIEW:{reviewStatus:"IN_REVIEW",status:"DRAFT"},
 APPROVE:{reviewStatus:"APPROVED",status:"READY"},
} as const;

export function workflowTransition(action:keyof typeof transitions,current:string){
 if(action==="SUBMIT_REVIEW"&&current!=="DRAFT")throw new Error("CMS_INVALID_TRANSITION");
 if(action==="APPROVE"&&current!=="IN_REVIEW")throw new Error("CMS_INVALID_TRANSITION");
 return transitions[action];
}
export function assertPublishable(reviewStatus:string){if(reviewStatus!=="APPROVED")throw new Error("CMS_APPROVAL_REQUIRED")}
export function createPreviewCredential(){const token=randomBytes(32).toString("base64url");return{token,tokenHash:hashPreviewToken(token)}}
export function hashPreviewToken(token:string){return createHash("sha256").update(token).digest("hex")}
export function normalizeRedirectPath(value:string){const path=value.trim();if(!path.startsWith("/")||path.startsWith("//")||path.includes("\\")||/[\r\n]/.test(path))throw new Error("CMS_INVALID_REDIRECT");return path}
