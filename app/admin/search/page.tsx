import type { AdminRoleName } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { anyRoleAllows } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

export default async function AdminSearch({searchParams}:{searchParams:Promise<{q?:string}>}){
 let access:Awaited<ReturnType<typeof requireAdmin>>;try{access=await requireAdmin()}catch{redirect("/auth/login?next=/admin/search")}
 const q=(await searchParams).q?.trim().slice(0,100)??"",roles=access.admin.roles.map(item=>item.role.name) as AdminRoleName[];
 if(q.length<2)return <div className="mt-8"><p className="eyebrow">Global search</p><h1 className="font-display text-3xl">Search the control centre</h1><p className="mt-3 text-sm text-white/45">Enter at least two characters. Results are limited by your assigned permissions.</p></div>;
 const result=await searchRecords(q,roles);
 if(!result)return <div className="mt-8 rounded-2xl border border-amber/20 bg-amber/5 p-6">Search is unavailable while the operational database is offline.</div>;
 const[users,films,payments]=result;
  const groups=[{title:"Users",href:"/admin/users",items:users.map(item=>({id:item.id,label:item.name,detail:item.email}))},{title:"Content",href:"/admin/content",items:films.map(item=>({id:item.id,label:item.title,detail:`/${item.slug}`}))},{title:"Payments",href:"/admin/payments",items:payments.map(item=>({id:item.id,label:item.providerTransactionId??item.id,detail:item.status}))}].filter(group=>group.items.length);
  return <div className="mt-8"><p className="eyebrow">Global search</p><h1 className="font-display text-3xl">Results for “{q}”</h1><div className="mt-8 grid gap-5 xl:grid-cols-3">{groups.map(group=><section key={group.title} className="rounded-2xl border border-white/8 bg-white/[.035] p-5"><div className="flex items-center justify-between"><h2 className="font-display text-xl">{group.title}</h2><Link className="text-xs text-amber" href={`${group.href}?q=${encodeURIComponent(q)}`}>View all</Link></div><div className="mt-4 divide-y divide-white/8">{group.items.map(item=><div key={item.id} className="py-3"><p className="text-sm font-semibold">{item.label}</p><p className="text-xs text-white/40">{item.detail}</p></div>)}</div></section>)}{!groups.length&&<p className="text-sm text-white/45">No permitted records matched this search.</p>}</div></div>;
}

async function searchRecords(q:string,roles:AdminRoleName[]){try{return await Promise.all([
 anyRoleAllows(roles,"users:read")?prisma.user.findMany({where:{OR:[{name:{contains:q,mode:"insensitive"}},{email:{contains:q,mode:"insensitive"}}]},take:10,select:{id:true,name:true,email:true}}):[],
 anyRoleAllows(roles,"catalog:read")?prisma.film.findMany({where:{OR:[{title:{contains:q,mode:"insensitive"}},{slug:{contains:q,mode:"insensitive"}}]},take:10,select:{id:true,title:true,slug:true}}):[],
 anyRoleAllows(roles,"payments:read")?prisma.payment.findMany({where:{providerTransactionId:{contains:q,mode:"insensitive"}},take:10,select:{id:true,providerTransactionId:true,status:true}}):[],
 ])}catch{return null}}
