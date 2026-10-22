import type { AdminRoleName } from "@prisma/client";
import Link from "next/link";
import { Activity,BarChart3,Clapperboard,CreditCard,FileText,Film,LayoutDashboard,MessageSquare,Settings,Shield,Tags,Users,Workflow } from "lucide-react";
import { anyRoleAllows } from "@/lib/auth/permissions";

const items=[
 ["Dashboard",LayoutDashboard,"/admin",null],["Content",Clapperboard,"/admin/content","catalog:read"],["CMS",FileText,"/admin/cms","cms:read"],["Taxonomy",Tags,"/admin/taxonomy","catalog:read"],["Users",Users,"/admin/users","users:read"],["Payments",CreditCard,"/admin/payments","payments:read"],["Subscriptions",CreditCard,"/admin/subscriptions","subscriptions:read"],["Media",Film,"/admin/media","media:read"],["Analytics",BarChart3,"/admin/analytics","analytics:read"],["Operations",Workflow,"/admin/operations","operations:read"],["Moderation",MessageSquare,"/admin/moderation","moderation:read"],["Audit",Shield,"/admin/audit","audit:read"],["Security",Shield,"/admin/security","security:read"],["Settings",Settings,"/admin/settings","settings:read"],["System",Activity,"/admin/system","system:read"],
] as const;

export function AdminSidebar({roles}:{roles:readonly AdminRoleName[]}){
 const visible=items.filter(item=>!item[3]||anyRoleAllows(roles,item[3]));
 return <aside className="w-full shrink-0 border-b border-white/8 bg-[#080c13] p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:p-5"><Link href="/" className="font-display text-xl tracking-[.2em]">ORUN <span className="font-sans text-[10px] tracking-normal text-amber">ADMIN</span></Link><nav aria-label="Administration" className="scrollbar-none mt-5 flex gap-1 overflow-x-auto lg:mt-10 lg:block lg:space-y-1">{visible.map(([label,Icon,href])=><Link key={label} href={href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/55 hover:bg-white/5 hover:text-white"><Icon size={18}/>{label}</Link>)}</nav></aside>;
}
