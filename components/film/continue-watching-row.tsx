"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";
import { films } from "@/server/demo/catalog";
import { formatPlaybackTime, readWatchHistory, resetWatchProgress, WATCH_HISTORY_EVENT, type WatchProgress } from "@/lib/viewer/watch-history";

export function ContinueWatchingRow() {
  const [items, setItems] = useState<Array<{ film: (typeof films)[number]; progress: WatchProgress }>>([]);

  useEffect(() => {
    const refresh = () => {
      const history = readWatchHistory();
      setItems(films.map((film) => ({ film, progress: history[film.id] })).filter((item): item is { film: (typeof films)[number]; progress: WatchProgress } => Boolean(item.progress && !item.progress.completed && item.progress.positionSeconds >= 10)).sort((a, b) => b.progress.updatedAt.localeCompare(a.progress.updatedAt)));
    };
    refresh();
    window.addEventListener(WATCH_HISTORY_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(WATCH_HISTORY_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);

  if (!items.length) return null;
  return <section aria-labelledby="continue-watching-title"><div className="mb-5 px-5 md:px-12 lg:px-20"><p className="eyebrow">Your activity on this device</p><h2 id="continue-watching-title" className="font-display text-2xl md:text-3xl">Continue watching</h2></div><div className="scrollbar-none flex gap-4 overflow-x-auto px-5 pb-3 md:px-12 lg:px-20">{items.map(({ film, progress }) => <article key={film.id} className="group relative w-[78vw] max-w-[420px] flex-none overflow-hidden rounded-2xl border border-white/10 bg-[#0b111b]"><div className="aspect-video bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top,rgba(5,7,11,.96),rgba(5,7,11,.08)),url(${film.posterUrl})` }}><div className="absolute inset-x-0 bottom-0 h-1 bg-white/15"><div className="h-full bg-amber" style={{ width: `${progress.completionPercent}%` }} /></div><div className="absolute inset-x-4 bottom-4"><p className="text-xs font-semibold uppercase tracking-wider text-amber">{progress.completionPercent}% · resume at {formatPlaybackTime(progress.positionSeconds)}</p><h3 className="mt-1 font-display text-2xl">{film.title}</h3><div className="mt-3 flex gap-2"><Link href={`/watch/${film.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-amber px-4 text-xs font-bold text-black"><Play size={15} fill="currentColor" /> Continue</Link><button type="button" onClick={() => resetWatchProgress(film.id)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/15"><RotateCcw size={15} /> Start over</button></div></div></div></article>)}</div></section>;
}
