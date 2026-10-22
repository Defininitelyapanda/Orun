import { describe,expect,it } from "vitest";
import { aggregateDimensionHash,containsSecretMaterial,nextIncidentStatus,secureTokenMatches,securityFingerprint } from "@/lib/operations/controls";
describe("operations controls",()=>{
 it("uses constant-time compatible token comparison",()=>{expect(secureTokenMatches("a".repeat(24),"a".repeat(24))).toBe(true);expect(secureTokenMatches("a".repeat(24),"b".repeat(24))).toBe(false);expect(secureTokenMatches(undefined,"x")).toBe(false)});
 it("creates stable hashes",()=>{expect(securityFingerprint("API","Burst","account-1")).toBe(securityFingerprint("api","burst","ACCOUNT-1"));expect(aggregateDimensionHash("play",{country:"KE",device:"tv"})).toBe(aggregateDimensionHash("play",{device:"tv",country:"KE"}))});
 it("rejects secret-shaped metadata",()=>{expect(containsSecretMaterial({evidenceReference:"vault://rotation/2"})).toBe(false);expect(containsSecretMaterial({credentials:{apiToken:"value"}})).toBe(true)});
 it("enforces incident transitions",()=>{expect(nextIncidentStatus("OPEN","INVESTIGATE")).toBe("INVESTIGATING");expect(nextIncidentStatus("OPEN","RESOLVE")).toBeNull();expect(nextIncidentStatus("MITIGATED","RESOLVE")).toBe("RESOLVED")});
});
