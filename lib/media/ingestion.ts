import { z } from "zod";
export const mediaJobPayload=z.object({ingestionJobId:z.string().min(1),input:z.string().min(1),output:z.string().min(1),height:z.number().int().min(144).max(4320)});
export function retryDelay(attempt:number){return Math.min(30*60_000,30_000*2**Math.max(0,attempt-1))}
export function terminalIngestionStatus(attempts:number,maxAttempts:number){return attempts>=maxAttempts?"DEAD_LETTER" as const:"RETRY_WAIT" as const}
export function assertSafeMediaPath(root:string,candidate:string){const normalizedRoot=root.replaceAll("\\","/").replace(/\/$/,"")+"/",normalized=candidate.replaceAll("\\","/");if(!normalized.startsWith(normalizedRoot)||normalized.includes("/../"))throw new Error("UNSAFE_MEDIA_PATH");return candidate}
