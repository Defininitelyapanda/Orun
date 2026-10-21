import type { ReactNode } from "react";

export function AdminDataTable({headers,rows,empty="No records found."}:{headers:readonly string[];rows:ReactNode[][];empty?:string}){
 return <div className="overflow-x-auto rounded-2xl border border-white/8 bg-white/[.035]"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/8 bg-white/[.025] text-xs uppercase tracking-wider text-white/35"><tr>{headers.map(header=><th key={header} className="px-5 py-4 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-white/8">{rows.length?rows.map((row,index)=><tr key={index} className="hover:bg-white/[.025]">{row.map((cell,cellIndex)=><td key={cellIndex} className="px-5 py-4 align-top">{cell}</td>)}</tr>):<tr><td colSpan={headers.length} className="px-5 py-10 text-center text-white/40">{empty}</td></tr>}</tbody></table></div>;
}

export function AdminFilter({query,placeholder="Filter records"}:{query:string;placeholder?:string}){
 return <form className="flex gap-2"><input name="q" defaultValue={query} maxLength={100} placeholder={placeholder} className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080d15] px-3 text-sm"/><button className="glass-action" type="submit">Filter</button></form>;
}
