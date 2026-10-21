import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { assertSafeMediaPath,mediaJobPayload,retryDelay,terminalIngestionStatus } from "@/lib/media/ingestion";
describe("media operations",()=>{
 it("validates bounded worker payloads",()=>{expect(mediaJobPayload.parse({ingestionJobId:"job",input:"C:/media/in/file.mp4",output:"C:/media/out/file.m3u8",height:1080}).height).toBe(1080);expect(()=>mediaJobPayload.parse({ingestionJobId:"job",input:"x",output:"y",height:9000})).toThrow()});
 it("rejects paths outside configured media roots",()=>{expect(assertSafeMediaPath("C:/media/input","C:/media/input/title.mp4")).toContain("title.mp4");expect(()=>assertSafeMediaPath("C:/media/input","C:/Windows/secret.txt")).toThrow("UNSAFE_MEDIA_PATH");expect(()=>assertSafeMediaPath("C:/media/input","C:/media/input/../secret.txt")).toThrow("UNSAFE_MEDIA_PATH")});
 it("uses bounded exponential retry and dead-letter policy",()=>{expect(retryDelay(1)).toBe(30_000);expect(retryDelay(99)).toBe(1_800_000);expect(terminalIngestionStatus(4,5)).toBe("RETRY_WAIT");expect(terminalIngestionStatus(5,5)).toBe("DEAD_LETTER")});
 it("fails closed through scanning and persistent lifecycle controls",()=>{const worker=readFileSync("server/workers/media-worker.ts","utf8"),route=readFileSync("app/api/admin/media/jobs/[id]/actions/route.ts","utf8");expect(worker).toContain("MEDIA_SCAN_COMMAND");expect(worker).toContain("scanStatus:\"CLEAN\"");expect(worker).toContain("UnrecoverableError");expect(route).toContain("requireMfa:true");expect(route).toContain("requireRecentAuth:true");expect(route).toContain("appendAuditLog")});
});
