"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { CatalogGrid } from "@/components/film/catalog-grid";
import { films } from "@/server/demo/catalog";

export default function Search() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const results = useMemo(() => films.filter((film) =>
    `${film.title} ${film.country} ${film.director} ${film.genres.join(" ")}`.toLowerCase().includes(q.toLowerCase()),
  ), [q]);
  return <AppShell><h1 className="font-display text-4xl md:text-6xl">Search</h1><label className="my-8 flex max-w-3xl items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5"><SearchIcon className="text-white/35"/><span className="sr-only">Search films</span><input value={q} onChange={(event) => setQ(event.target.value)} autoFocus placeholder="Films, filmmakers, countries..." className="min-h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-white/30"/></label>{q && results.length === 0 ? <div className="py-20 text-center"><h2 className="font-display text-2xl">No worlds found.</h2></div> : <CatalogGrid items={q ? results : films}/>}</AppShell>;
}
