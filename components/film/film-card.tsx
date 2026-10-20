"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Eye, Play } from "lucide-react";
import type { Film } from "@/server/demo/catalog";
import { getWatchState, readWatchHistory, WATCH_HISTORY_EVENT, type WatchProgress } from "@/lib/viewer/watch-history";
import { TrailerDialog } from "./trailer-dialog";

const gradients = ["from-[#5a2d20] via-[#1c3148] to-[#07101a]", "from-[#143a45] via-[#1c253f] to-[#080b12]", "from-[#50381d] via-[#282330] to-[#07090e]", "from-[#2b193d] via-[#122e45] to-[#06090e]", "from-[#15372e] via-[#19253e] to-[#06080d]"];

export function FilmCard({ film, index = 0 }: { film: Film; index?: number }) {
  const [progress, setProgress] = useState<WatchProgress>();
  useEffect(() => {
    const refresh = () => setProgress(readWatchHistory()[film.id]);
    refresh(); window.addEventListener(WATCH_HISTORY_EVENT, refresh); window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(WATCH_HISTORY_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, [film.id]);
  const watchState = progress ? getWatchState(progress.positionSeconds, progress.durationSeconds) : "not-watched";
  const posterStyle = film.posterUrl ? { backgroundImage: `linear-gradient(to top,rgba(5,7,11,.96),rgba(5,7,11,.04) 72%),url(${film.posterUrl})` } : undefined;
  return <article className="group relative w-[44vw] min-w-[160px] max-w-[250px] flex-none overflow-hidden rounded-xl border border-white/8 bg-[#0b111b] shadow-2xl md:w-[19vw]">
    <div className={`relative aspect-[2/3] bg-gradient-to-br bg-cover bg-center ${gradients[index % gradients.length]}`} style={posterStyle}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/15"/>
      <Link href={`/films/${film.slug}`} aria-label={`View ${film.title}`} className="absolute inset-0 z-10"><span className="sr-only">View {film.title}</span></Link>
      {watchState !== "not-watched" && <div className="absolute left-3 top-3 z-30 flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 bg-black/75 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-md"><Eye size={14}/>{watchState === "watched" ? <Check size={12}/> : <span>{progress?.completionPercent}%</span>}</div>}
      {film.trailerUrl && <div className="absolute right-3 top-3 z-30 [&_.glass-action]:min-h-10 [&_.glass-action]:px-3 [&_.glass-action]:py-1 [&_.glass-action]:text-xs"><TrailerDialog title={film.title} synopsis={film.synopsis} slug={film.slug} trailerUrl={film.trailerUrl} lowBandwidthUrl={film.trailerLowBandwidthUrl} duration={film.trailerDuration}/></div>}
      <div className="pointer-events-none absolute inset-x-4 bottom-5 z-20"><p className="mb-2 text-[10px] uppercase tracking-[.22em] text-amber">{film.isOriginal ? "ORUN Original" : film.country}</p><h3 className="font-display text-xl leading-tight md:text-2xl">{film.title}</h3></div>
      {!film.trailerUrl && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100"><span className="grid h-12 w-12 place-items-center rounded-full bg-amber text-black"><Play size={18} fill="currentColor"/></span></div>}
      {watchState === "in-progress" && progress && <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/15"><div className="h-full bg-amber" style={{ width: `${progress.completionPercent}%` }}/></div>}
    </div>
    <Link href={`/films/${film.slug}`} className="flex items-center justify-between px-3 py-3 text-xs text-white/55 hover:text-white"><span>{film.year} · {film.genres[0]}</span><strong className="text-amber">{film.score ? `${film.score.toFixed(1)} / 5` : "Not rated"}</strong></Link>
  </article>;
}
