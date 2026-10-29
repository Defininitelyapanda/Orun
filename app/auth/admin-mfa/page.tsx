import { redirect } from "next/navigation";
import { AdminMfaPanel } from "@/components/admin/admin-mfa-panel";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata={title:"Administrator verification"};
export default async function AdminMfaChallenge(){let access:Awaited<ReturnType<typeof requireAdmin>>;try{access=await requireAdmin()}catch{redirect("/auth/admin-login?next=/auth/admin-mfa")}return <main className="mx-auto min-h-[75vh] max-w-3xl px-5 py-16"><p className="eyebrow">Protected operations</p><h1 className="font-display text-4xl">Verify administrator access</h1><AdminMfaPanel enrolled={Boolean(access.admin.twoFactorVerifiedAt)} challenge/></main>}
