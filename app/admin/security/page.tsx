import { redirect } from "next/navigation";
import { AdminMfaPanel } from "@/components/admin/admin-mfa-panel";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminSecurity(){let access:Awaited<ReturnType<typeof requireAdmin>>;try{access=await requireAdmin("security:read")}catch(error){if(error instanceof Error&&error.message==="AUTH_REQUIRED")redirect("/auth/admin-login?next=/admin/security");return <div className="mt-8">Access denied.</div>}return <div className="mt-8"><p className="eyebrow">Security</p><h1 className="font-display text-3xl md:text-4xl">Administrator security</h1><div className="mt-5 flex flex-wrap gap-3 text-xs"><span className="rounded-full bg-white/7 px-3 py-2">MFA enrolled: {access.admin.twoFactorVerifiedAt?"Yes":"No"}</span><span className="rounded-full bg-white/7 px-3 py-2">Current session verified: {access.session.mfaVerifiedAt?"Yes":"No"}</span></div><AdminMfaPanel enrolled={Boolean(access.admin.twoFactorVerifiedAt)}/></div>}
