import Link from "next/link";
import { Search,SlidersHorizontal,X } from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { CatalogGrid } from "@/components/film/catalog-grid";
import { GenreSelector } from "@/components/taxonomy/genre-selector";
import { films } from "@/server/demo/catalog";
import { filterAndSortCatalog,type CatalogQuery } from "@/lib/catalog/discovery";
import { contentFormats,storyThemes,tones } from "@/lib/taxonomy/catalog";
import { getPublicGenreGroups } from "@/lib/taxonomy/public-taxonomy";

export const metadata={title:"Discover"};
const selectClass="min-h-11 rounded-xl border border-white/10 bg-[#0b121c] px-3 text-sm text-white/75";
const selectedValues=(value?:string|string[])=>value?(Array.isArray(value)?value:[value]):[];

export default async function Discover({searchParams}:{searchParams:Promise<CatalogQuery&{mood?:string}>}){
 const query=await searchParams,genreGroups=await getPublicGenreGroups();const moodFiltered=query.mood?films.filter(film=>film.moods.includes(query.mood!)):films;const results=filterAndSortCatalog(moodFiltered,query);const page=Math.max(1,Number(query.page)||1),pageSize=10,items=results.slice((page-1)*pageSize,page*pageSize);const languages=[...new Set(films.flatMap(film=>[...film.audioLanguages,...film.subtitleLanguages]))].sort();const active=Object.entries(query).filter(([key,value])=>key!=="page"&&value&&(Array.isArray(value)?value.length:true));const selectedGenres=selectedValues(query.genre);const hasRatings=films.some(film=>typeof film.score==="number"&&(film.ratingCount??0)>0);
 const pageHref=(next:number)=>{const params=new URLSearchParams();for(const[key,value]of Object.entries(query)){if(key==="page"||!value)continue;for(const item of Array.isArray(value)?value:[value])params.append(key,item)}params.set("page",String(next));return`/discover?${params}`};
 return <AppShell>
  <p className="eyebrow">Cinematic discovery</p><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="font-display text-4xl md:text-6xl">Browse every kind of story</h1><p className="mt-3 max-w-3xl text-white/55">Explore African and international cinema by genre, theme, tone, format, origin and accessibility. Filter choices remain in the URL for easy sharing.</p></div><span className="text-sm text-white/40">{results.length} title{results.length===1?"":"s"}</span></div>
  <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Genre groups">{genreGroups.map(group=><Link key={group.slug} href={`/genres/${group.slug}`} className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[.055] to-transparent p-5 transition hover:border-amber/35 hover:bg-amber/[.04]"><p className="font-display text-lg">{group.name}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">{group.description}</p><p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-amber">Explore {group.genres.length} classifications</p></Link>)}</section>
  <form method="get" className="my-8 rounded-2xl border border-white/10 bg-white/[.035] p-4 md:p-6">
   <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={17} className="text-amber"/>Refine the catalogue</div>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <label className="relative sm:col-span-2"><span className="sr-only">Search titles and classifications</span><Search className="absolute left-3 top-3.5 text-white/35" size={16}/><input name="q" defaultValue={query.q} placeholder="Search title, story, creator or genre" className={`${selectClass} w-full pl-10`}/></label>
    <select name="genreLogic" defaultValue={query.genreLogic??"and"} className={selectClass} aria-label="Genre matching"><option value="and">Match all selected genres</option><option value="or">Match any selected genre</option></select>
    <select name="sort" defaultValue={query.sort??"recommended"} className={selectClass} aria-label="Sort films"><option value="recommended">Recommended for You</option><option value="popular">Most Popular</option><option value="trending">Trending</option>{hasRatings&&<><option value="highest-rated">Highest Rated</option><option value="most-rated">Most Rated</option></>}<option value="recently-added">Recently Added</option><option value="year">Release Year</option><option value="alphabetical">Alphabetical</option><option value="shortest">Shortest Runtime</option><option value="longest">Longest Runtime</option></select>
    <GenreSelector groups={genreGroups} selected={selectedGenres}/>
    <select name="theme" defaultValue={typeof query.theme==="string"?query.theme:""} className={selectClass} aria-label="Story theme"><option value="">All story themes</option>{storyThemes.map(value=><option key={value}>{value}</option>)}</select>
    <select name="tone" defaultValue={typeof query.tone==="string"?query.tone:""} className={selectClass} aria-label="Tone"><option value="">Any tone</option>{tones.map(value=><option key={value}>{value}</option>)}</select>
    <select name="region" defaultValue={query.region??""} className={selectClass} aria-label="Region"><option value="">All regions</option>{[...new Set(films.map(film=>film.region))].map(value=><option key={value}>{value}</option>)}</select>
    <select name="country" defaultValue={query.country??""} className={selectClass} aria-label="Country"><option value="">All countries</option>{[...new Set(films.map(film=>film.country))].map(value=><option key={value}>{value}</option>)}</select>
    <select name="format" defaultValue={query.format??""} className={selectClass} aria-label="Content format"><option value="">All formats</option>{contentFormats.map(value=><option key={value} value={value.endsWith(" Film")?`${value}s`:value}>{value}</option>)}</select>
    <select name="language" defaultValue={query.language??""} className={selectClass} aria-label="Language"><option value="">All languages</option>{languages.map(value=><option key={value}>{value}</option>)}</select>
    <select name="ageRating" defaultValue={query.ageRating??""} className={selectClass} aria-label="Age classification"><option value="">Any age classification</option>{[...new Set(films.map(film=>film.ageRating))].map(value=><option key={value}>{value}</option>)}</select>
    <select name="quality" defaultValue={query.quality??""} className={selectClass} aria-label="Streaming quality"><option value="">Any quality</option>{[...new Set(films.flatMap(film=>film.videoQualities))].sort().map(value=><option key={value}>{value}</option>)}</select>
    <select name="access" defaultValue={query.access??""} className={selectClass} aria-label="Availability"><option value="">All availability</option>{["Free","Subscription","Rental","Purchase"].map(value=><option key={value}>{value}</option>)}</select>
    <input name="yearFrom" defaultValue={query.yearFrom} inputMode="numeric" placeholder="Year from" aria-label="Release year from" className={selectClass}/><input name="yearTo" defaultValue={query.yearTo} inputMode="numeric" placeholder="Year to" aria-label="Release year to" className={selectClass}/>
    <select name="duration" defaultValue={query.duration??""} className={selectClass} aria-label="Runtime"><option value="">Any runtime</option><option value="short">Under 40 minutes</option><option value="feature">40+ minutes</option></select>
   </div><div className="mt-4 flex flex-wrap gap-3"><button className="primary-action" type="submit">Apply filters</button>{active.length>0&&<Link href="/discover" className="glass-action"><X size={16}/>Clear all filters</Link>}</div>
  </form>
  {selectedGenres.length>0&&<div className="mb-6 flex flex-wrap items-center gap-2"><span className="text-xs text-white/40">Selected:</span>{selectedGenres.map(value=><span key={value} className="rounded-full border border-amber/30 bg-amber/8 px-3 py-1 text-xs text-amber">{value}</span>)}</div>}
  {items.length?<CatalogGrid items={items}/>:<div className="rounded-2xl border border-white/10 bg-white/4 p-12 text-center"><h2 className="font-display text-2xl">No films match these filters.</h2><p className="mt-2 text-white/50">Try matching any selected genre or clear one or more filters.</p><Link href="/discover" className="primary-action mt-6">Clear all filters</Link></div>}
  {results.length>pageSize&&<nav className="mt-10 flex items-center justify-center gap-3" aria-label="Catalogue pages">{page>1&&<Link href={pageHref(page-1)} className="glass-action">Previous</Link>}<span className="text-sm text-white/45">Page {page} of {Math.ceil(results.length/pageSize)}</span>{page*pageSize<results.length&&<Link href={pageHref(page+1)} className="glass-action">Next</Link>}</nav>}
 </AppShell>
}
