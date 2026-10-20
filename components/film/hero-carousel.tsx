"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play, Plus } from "lucide-react";
import type { Film } from "@/server/demo/catalog";
import { TrailerDialog } from "./trailer-dialog";

export function HeroCarousel({ items, interval = 8000 }: { items: Film[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const active = items[index] ?? items[0];
  useEffect(() => {
    if (paused || items.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex(value => (value + 1) % items.length), interval);
    return () => window.clearInterval(timer);
  }, [interval, items.length, paused]);
  if (!active) return null;
  const move = (direction: number) => setIndex(value => (value + direction + items.length) % items.length);
  return <section className="hero relative flex min-h-[78svh] items-end overflow-hidden px-5 pb-16 pt-28 md:min-h-[88vh] md:px-12 md:pb-24 lg:px-20" aria-roledescription="carousel" aria-label="Featured films" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={event => { if (touchStart.current === null) return; const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1); touchStart.current = null; }}>
    <div key={active.id} className="hero-art absolute inset-0" style={active.posterUrl ? { backgroundImage: `url(${active.posterUrl})` } : undefined} aria-hidden="true"/><div className="hero-shade absolute inset-0"/>
    <div className="relative z-10 max-w-2xl" aria-live="polite"><div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-amber"><span className="h-px w-8 bg-amber"/>{active.isOriginal ? "ORUN Original" : `${active.country} · Featured for you`}</div><h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[.86] tracking-[-.04em]">{active.title}</h1><p className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className="rounded border border-white/20 px-2 py-1 text-white">{active.ageRating}</span><span>{active.year}</span>{active.runtime > 0 && <span>{active.runtime} min</span>}<span>{active.genres.join(" · ")}</span></p><p className="mt-5 max-w-xl text-base leading-7 text-white/75 md:text-lg">{active.synopsis}</p><div className="mt-8 flex flex-wrap items-center gap-3"><Link className="primary-action" href={`/watch/${active.id}`}><Play size={18} fill="currentColor"/>Watch now</Link>{active.trailerUrl && <TrailerDialog title={active.title} synopsis={active.synopsis} slug={active.slug} trailerUrl={active.trailerUrl} lowBandwidthUrl={active.trailerLowBandwidthUrl} duration={active.trailerDuration}/>}<button className="glass-action" aria-label={`Add ${active.title} to My List`}><Plus size={19}/>My list</button></div></div>
    <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 md:bottom-8 md:right-10"><button type="button" onClick={() => move(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/35" aria-label="Previous featured film"><ChevronLeft/></button><div className="flex gap-1.5">{items.map((film, itemIndex) => <button key={film.id} onClick={() => setIndex(itemIndex)} className={`h-1.5 rounded-full transition-all ${itemIndex === index ? "w-7 bg-amber" : "w-3 bg-white/35"}`} aria-label={`Show ${film.title}`} aria-current={itemIndex === index}/>)}</div><button type="button" onClick={() => move(1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/35" aria-label="Next featured film"><ChevronRight/></button><button type="button" onClick={() => setPaused(value => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/35" aria-label={paused ? "Resume carousel" : "Pause carousel"}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button></div>
  </section>;
}
