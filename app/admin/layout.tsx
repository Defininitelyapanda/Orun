import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth/admin";
export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:ReactNode}){
 let access:Awaited<ReturnType<typeof requireAdmin>>;
 try{access=await requireAdmin()}catch{redirect("/auth/login?next=/admin")}
 const roles=access.admin.roles.map(item=>item.role.name),initials=access.session.user.name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();
 return <main className="flex min-h-screen flex-col bg-[#05070b] lg:flex-row"><AdminSidebar roles={roles}/><section className="min-w-0 flex-1 p-5 md:p-8 xl:p-10"><header className="flex flex-col gap-4 border-b border-white/8 pb-6 xl:flex-row xl:items-center xl:justify-between"><div><p className="eyebrow">ORUN operations</p><p className="text-xs text-white/40">{access.session.user.email} · {roles.join(", ")}</p></div><div className="flex items-center gap-3"><form action="/admin/search" className="relative min-w-0 flex-1 xl:w-80"><Search size={15} className="absolute left-3 top-3.5 text-white/35"/><input aria-label="Search control centre" name="q" maxLength={100} placeholder="Search users, titles, payments" className="min-h-11 w-full rounded-xl border border-white/10 bg-[#080d15] px-3 pl-9 text-sm"/></form><div title={access.session.user.name} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber/15 text-xs text-amber">{initials}</div></div></header>{children}</section></main>;
}
