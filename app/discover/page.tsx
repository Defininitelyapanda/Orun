import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { CatalogGrid } from "@/components/film/catalog-grid";
import { films } from "@/server/demo/catalog";
import { filterAndSortCatalog, type CatalogQuery } from "@/lib/catalog/discovery";

export const metadata = { title: "Discover" };
const selectClass = "min-h-11 rounded-xl border border-white/10 bg-[#0b121c] px-3 text-sm text-white/75";

export default async function Discover({ searchParams }: { searchParams: Promise<CatalogQuery & { mood?: string }> }) {
  const query = await searchParams;
  const moodFiltered = query.mood ? films.filter(film => film.moods.includes(query.mood!)) : films;
  const results = filterAndSortCatalog(moodFiltered, query);
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = 10;
  const items = results.slice((page - 1) * pageSize, page * pageSize);
  const genres = [...new Set(films.flatMap(film => film.genres))].sort();
  const themes = [...new Set(films.flatMap(film => film.themes))].sort();
  const languages = [...new Set(films.flatMap(film => [...film.audioLanguages, ...film.subtitleLanguages]))].sort();
  const active = Object.entries(query).filter(([key, value]) => key !== "page" && value && (Array.isArray(value) ? value.length : true));
  const pageHref = (next: number) => { const params = new URLSearchParams(); for (const [key, value] of Object.entries(query)) { if (key === "page" || !value) continue; for (const item of Array.isArray(value) ? value : [value]) params.append(key, item); } params.set("page", String(next)); return `/discover?${params}`; };
  return <AppShell>
    <p className="eyebrow">Cinematic discovery</p><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="font-display text-4xl md:text-6xl">Browse Films</h1><p className="mt-3 max-w-2xl text-white/55">Combine genres, themes, region, language, year and availability. Every selection stays in the URL so this view can be shared.</p></div><span className="text-sm text-white/40">{results.length} title{results.length === 1 ? "" : "s"}</span></div>
    <form method="get" className="my-8 rounded-2xl border border-white/10 bg-white/[.035] p-4 md:p-6">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={17} className="text-amber"/>Filter the catalogue</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative sm:col-span-2"><span className="sr-only">Search titles</span><Search className="absolute left-3 top-3.5 text-white/35" size={16}/><input name="q" defaultValue={query.q} placeholder="Search title, story or creator" className={`${selectClass} w-full pl-10`}/></label>
        <select name="genre" defaultValue={typeof query.genre === "string" ? query.genre : ""} className={selectClass} aria-label="Genre"><option value="">All genres</option>{genres.map(value => <option key={value}>{value}</option>)}</select>
        <select name="theme" defaultValue={typeof query.theme === "string" ? query.theme : ""} className={selectClass} aria-label="Story theme"><option value="">All story themes</option>{themes.map(value => <option key={value}>{value}</option>)}</select>
        <select name="region" defaultValue={query.region ?? ""} className={selectClass} aria-label="Region"><option value="">All regions</option>{[...new Set(films.map(film => film.region))].map(value => <option key={value}>{value}</option>)}</select>
        <select name="format" defaultValue={query.format ?? ""} className={selectClass} aria-label="Content format"><option value="">All formats</option>{[...new Set(films.map(film => film.contentFormat))].map(value => <option key={value}>{value}</option>)}</select>
        <select name="language" defaultValue={query.language ?? ""} className={selectClass} aria-label="Language"><option value="">All languages</option>{languages.map(value => <option key={value}>{value}</option>)}</select>
        <select name="access" defaultValue={query.access ?? ""} className={selectClass} aria-label="Availability"><option value="">All availability</option>{["Free","Subscription","Rental","Purchase"].map(value => <option key={value}>{value}</option>)}</select>
        <input name="yearFrom" defaultValue={query.yearFrom} inputMode="numeric" placeholder="Year from" aria-label="Release year from" className={selectClass}/><input name="yearTo" defaultValue={query.yearTo} inputMode="numeric" placeholder="Year to" aria-label="Release year to" className={selectClass}/>
        <select name="duration" defaultValue={query.duration ?? ""} className={selectClass} aria-label="Duration"><option value="">Any duration</option><option value="short">Under 40 minutes</option><option value="feature">40+ minutes</option></select>
        <select name="sort" defaultValue={query.sort ?? "recommended"} className={selectClass} aria-label="Sort films"><option value="recommended">Recommended for You</option><option value="popular">Most Popular</option><option value="trending">Trending</option><option value="highest-rated">Highest Rated</option><option value="most-rated">Most Rated</option><option value="recently-added">Recently Added</option><option value="year">Release Year</option><option value="alphabetical">Alphabetical</option><option value="shortest">Shortest Duration</option><option value="longest">Longest Duration</option></select>
      </div><div className="mt-4 flex flex-wrap gap-3"><button className="primary-action" type="submit">Apply filters</button>{active.length > 0 && <Link href="/discover" className="glass-action"><X size={16}/>Clear all filters</Link>}</div>
    </form>
    <div className="mb-7 flex gap-2 overflow-x-auto pb-2 scrollbar-none"><Link href="/discover" className="mood-chip shrink-0">All</Link>{["Drama","Romance","Short Films"].map(genre => <Link key={genre} href={`/discover?genre=${encodeURIComponent(genre)}`} className={`mood-chip shrink-0 ${query.genre === genre ? "border-amber/60 bg-amber/10 text-amber" : ""}`}>{genre}</Link>)}</div>
    {items.length ? <CatalogGrid items={items}/> : <div className="rounded-2xl border border-white/10 bg-white/4 p-12 text-center"><h2 className="font-display text-2xl">No films match these filters.</h2><p className="mt-2 text-white/50">Remove one or more filters, or clear them all to return to the full catalogue.</p><Link href="/discover" className="primary-action mt-6">Clear all filters</Link></div>}
    {results.length > pageSize && <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Catalogue pages">{page > 1 && <Link href={pageHref(page - 1)} className="glass-action">Previous</Link>}<span className="text-sm text-white/45">Page {page} of {Math.ceil(results.length / pageSize)}</span>{page * pageSize < results.length && <Link href={pageHref(page + 1)} className="glass-action">Next</Link>}</nav>}
  </AppShell>;
}
