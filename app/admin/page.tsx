import { Activity,Clapperboard,CreditCard,DollarSign,Users } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminModerationQueue,AdminUpgradeControls } from "@/components/admin/upgrade-controls";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { ClassificationEditor } from "@/components/taxonomy/classification-editor";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { films } from "@/server/demo/catalog";

export const metadata={title:"Administration"};
type Metric={label:string;value:string;Icon:typeof Users};

function dateRange(from?:string,to?:string){
 const end=to&&Number.isFinite(Date.parse(to))?new Date(to):new Date();
 const start=from&&Number.isFinite(Date.parse(from))?new Date(from):new Date(end.getTime()-30*24*3600_000);
 if(start>end||end.getTime()-start.getTime()>366*24*3600_000)return{start:new Date(end.getTime()-30*24*3600_000),end};
 return{start,end};
}

async function dashboardData(start:Date,end:Date){
 try{
  const [users,subscribers,publishedFilms,publishedSeries,drafts,failedPayments,revenue,reports,processing,recent]=await Promise.all([
   prisma.user.count({where:{createdAt:{lte:end},status:{not:"DELETED"}}}),
   prisma.subscription.count({where:{status:{in:["TRIALING","ACTIVE"]},startsAt:{lte:end},OR:[{currentPeriodEnd:null},{currentPeriodEnd:{gt:end}}]}}),
   prisma.film.count({where:{status:"PUBLISHED"}}),prisma.series.count({where:{status:"PUBLISHED"}}),
   prisma.film.count({where:{status:{in:["DRAFT","PROCESSING","READY"]}}}),
   prisma.payment.count({where:{status:"FAILED",createdAt:{gte:start,lte:end}}}),
   prisma.payment.aggregate({_sum:{amount:true},where:{status:"SUCCEEDED",createdAt:{gte:start,lte:end}}}),
   prisma.commentReport.count({where:{status:"OPEN"}}),prisma.mediaAsset.count({where:{status:{in:["UPLOADED","VALIDATING","PROCESSING"]}}}),
   prisma.auditLog.findMany({where:{createdAt:{gte:start,lte:end}},orderBy:{createdAt:"desc"},take:8,select:{id:true,action:true,targetType:true,outcome:true,createdAt:true}}),
  ]);
  return{available:true,metrics:[{label:"Total users",value:users.toLocaleString(),Icon:Users},{label:"Active subscribers",value:subscribers.toLocaleString(),Icon:Activity},{label:"Published titles",value:(publishedFilms+publishedSeries).toLocaleString(),Icon:Clapperboard},{label:"Revenue in range",value:`KES ${Number(revenue._sum.amount??0n).toLocaleString()}`,Icon:DollarSign}] satisfies Metric[],operations:{drafts,failedPayments,reports,processing},recent};
 }catch(error){console.error("Admin dashboard query failed",error instanceof Error?error.message:"UNKNOWN");return{available:false,metrics:[] as Metric[],operations:null,recent:[]};}
}

export default async function Admin({searchParams}:{searchParams:Promise<{view?:string;from?:string;to?:string}>}){
 const params=await searchParams;
 let access:Awaited<ReturnType<typeof requireAdmin>>;
 try{access=await requireAdmin()}catch{redirect("/auth/login?next=/admin")}
 const{session,admin}=access,controls=params.view==="films"||params.view==="content",moderation=params.view==="comments",taxonomy=params.view==="taxonomy";
 const title=taxonomy?"Taxonomy manager":controls?"Catalogue controls":moderation?"Comment moderation":"Control centre";
 const range=dateRange(params.from,params.to),data=await dashboardData(range.start,range.end),initials=session.user.name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();
 return <main className="flex min-h-screen bg-[#05070b]"><AdminSidebar/><section className="min-w-0 flex-1 p-5 md:p-10"><header className="flex items-center justify-between"><div><p className="eyebrow">ORUN operations</p><h1 className="font-display text-3xl md:text-4xl">{title}</h1><p className="mt-2 text-xs text-white/40">Signed in as {session.user.email} · {admin.roles.map(item=>item.role.name).join(", ")}</p></div><div className="grid h-10 w-10 place-items-center rounded-full bg-amber/15 text-xs text-amber">{initials}</div></header>
  {taxonomy?<div className="mt-10"><TaxonomyManager/></div>:controls?<div className="mt-10 space-y-6"><AdminUpgradeControls films={films}/><ClassificationEditor films={films} mode="admin"/></div>:moderation?<div className="mt-10"><AdminModerationQueue/></div>:<Dashboard data={data} start={range.start} end={range.end}/>}
 </section></main>;
}

function Dashboard({data,start,end}:{data:Awaited<ReturnType<typeof dashboardData>>;start:Date;end:Date}){
 if(!data.available)return <section className="mt-10 rounded-2xl border border-red-400/20 bg-red-400/5 p-6"><h2 className="font-display text-xl">Operational data unavailable</h2><p className="mt-2 text-sm text-white/55">The dashboard could not reach its data store. No fallback or demo values are being shown.</p></section>;
 const operations=[{label:"Draft and processing films",value:data.operations!.drafts,Icon:Clapperboard},{label:"Failed payments",value:data.operations!.failedPayments,Icon:CreditCard},{label:"Open reports",value:data.operations!.reports,Icon:Activity},{label:"Media jobs in progress",value:data.operations!.processing,Icon:Clapperboard}];
 return <><p className="mt-8 text-xs text-white/40">Reporting window: {start.toLocaleDateString()} – {end.toLocaleDateString()}</p><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.metrics.map(({label,value,Icon})=><article key={label} className="rounded-2xl border border-white/8 bg-white/[.035] p-5"><Icon size={18} className="text-amber"/><p className="mt-7 text-sm text-white/40">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-2"><section className="rounded-2xl border border-white/8 bg-white/[.035] p-6"><h2 className="font-display text-xl">Queues requiring attention</h2><div className="mt-5 divide-y divide-white/8">{operations.map(({label,value,Icon})=><div key={label} className="flex items-center justify-between py-4 text-sm"><span className="flex items-center gap-3"><Icon size={16} className="text-amber"/>{label}</span><strong>{value}</strong></div>)}</div></section><section className="rounded-2xl border border-white/8 bg-white/[.035] p-6"><h2 className="font-display text-xl">Recent audited changes</h2><div className="mt-5 divide-y divide-white/8">{data.recent.length?data.recent.map(item=><div key={item.id} className="flex justify-between gap-4 py-4 text-sm"><span>{item.action} · {item.targetType}</span><span className={item.outcome==="SUCCEEDED"?"text-emerald-400":"text-red-300"}>{item.outcome}</span></div>):<p className="py-4 text-sm text-white/40">No audited changes in this period.</p>}</div></section></div></>;
}
