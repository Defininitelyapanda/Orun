"use client";
import { useMemo,useState } from "react";
import { Search } from "lucide-react";
import type { TaxonomyGroup } from "@/lib/taxonomy/catalog";

export function GenreSelector({groups,selected=[]}:{groups:readonly TaxonomyGroup[];selected:string[]}){
 const[query,setQuery]=useState("");const needle=query.trim().toLowerCase();
 const visible=useMemo(()=>groups.map(group=>({...group,genres:group.genres.filter(name=>!needle||name.toLowerCase().includes(needle))})).filter(group=>!needle||group.name.toLowerCase().includes(needle)||group.genres.length),[groups,needle]);
 return <section aria-labelledby="genre-filter-heading" className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2 lg:col-span-4">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="genre-filter-heading" className="text-sm font-semibold">Genres &amp; subgenres</h2><p className="mt-1 text-xs text-white/40">Choose several, then set whether titles must match all or any.</p></div><label className="relative sm:w-72"><span className="sr-only">Search genres</span><Search size={15} className="absolute left-3 top-3 text-white/35"/><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search genre or subgenre" className="min-h-10 w-full rounded-xl border border-white/10 bg-[#080d15] pl-9 pr-3 text-sm"/></label></div>
  <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{visible.map(group=><details key={group.slug} className="group rounded-xl border border-white/8 bg-white/[.025]" open={group.genres.some(name=>selected.includes(name))||undefined}><summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white/75">{group.name}<span className="float-right text-xs text-white/30">{group.genres.length}</span></summary><div className="max-h-56 overflow-y-auto border-t border-white/8 p-3"><div className="grid gap-2">{group.genres.map(name=><label key={`${group.slug}-${name}`} className="flex items-center gap-2 text-xs text-white/60 hover:text-white"><input type="checkbox" name="genre" value={name} defaultChecked={selected.includes(name)} className="accent-[#d69a3a]"/>{name}</label>)}</div></div></details>)}</div>
  {!visible.length&&<p className="mt-4 text-sm text-white/40">No genres match “{query}”.</p>}
 </section>
}
