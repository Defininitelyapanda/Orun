import { afterEach,beforeEach,describe,expect,it } from "vitest";
import { createRecoveryCodes,decryptTotpSecret,encryptTotpSecret,hashRecoveryCode,verifyTotp } from "@/lib/auth/admin-mfa";

const previous=process.env.ADMIN_MFA_ENCRYPTION_KEY;
beforeEach(()=>{process.env.ADMIN_MFA_ENCRYPTION_KEY="test-only-admin-mfa-key-with-32-chars"});
afterEach(()=>{if(previous===undefined)delete process.env.ADMIN_MFA_ENCRYPTION_KEY;else process.env.ADMIN_MFA_ENCRYPTION_KEY=previous});

describe("administrator MFA",()=>{
 it("verifies the RFC TOTP vector using the six-digit projection",async()=>{expect(await verifyTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ","287082",59_000)).toBe(true)});
 it("encrypts authenticator secrets at rest",async()=>{const encrypted=await encryptTotpSecret("JBSWY3DPEHPK3PXP");expect(encrypted).not.toContain("JBSWY3DPEHPK3PXP");expect(await decryptTotpSecret(encrypted)).toBe("JBSWY3DPEHPK3PXP")});
 it("creates unique-looking one-time recovery codes and stable hashes",async()=>{const codes=createRecoveryCodes();expect(new Set(codes).size).toBe(8);expect(await hashRecoveryCode(codes[0]!)).toBe(await hashRecoveryCode(codes[0]!.toLowerCase()))});
});
