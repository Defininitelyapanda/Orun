"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ExternalLink, Play, Volume2, X } from "lucide-react";
import type { Film } from "@/server/demo/catalog";

const gradients = ["from-[#5a2d20] via-[#1c3148] to-[#07101a]", "from-[#143a45] via-[#1c253f] to-[#080b12]", "from-[#50381d] via-[#282330] to-[#07090e]", "from-[#2b193d] via-[#122e45] to-[#06090e]", "from-[#15372e] via-[#19253e] to-[#06080d]"];

export function FilmCard({ film, index = 0 }: { film: Film; index?: number }) {
  const [previewing, setPreviewing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const posterStyle = film.posterUrl ? { backgroundImage: `linear-gradient(to top,rgba(5,7,11,.96),rgba(5,7,11,.04) 72%),url(${film.posterUrl})` } : undefined;

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded]);

  const mutedPreviewUrl = film.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(film.youtubeId)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${encodeURIComponent(film.youtubeId)}&playsinline=1&rel=0&modestbranding=1`
    : null;
  const fullPreviewUrl = film.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(film.youtubeId)}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1`
    : null;

  return (
    <>
      <article
        className="group relative w-[44vw] min-w-[160px] max-w-[250px] flex-none overflow-hidden rounded-xl border border-white/8 bg-[#0b111b] shadow-2xl md:w-[19vw]"
        onMouseEnter={() => setPreviewing(true)}
        onMouseLeave={() => setPreviewing(false)}
        onFocusCapture={() => setPreviewing(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPreviewing(false);
        }}
      >
        <div className={`relative aspect-[2/3] bg-gradient-to-br bg-cover bg-center ${gradients[index % gradients.length]}`} style={posterStyle}>
          {previewing && mutedPreviewUrl && (
            <iframe
              className="pointer-events-none absolute inset-0 h-full w-full scale-[1.02] bg-black object-cover"
              src={mutedPreviewUrl}
              title={`${film.title} muted preview`}
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              tabIndex={-1}
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/15" />
          <Link href={`/films/${film.slug}`} aria-label={`View ${film.title}`} className="absolute inset-0 z-10">
            <span className="sr-only">View {film.title}</span>
          </Link>
          <div className="pointer-events-none absolute inset-x-4 bottom-5 z-20">
            <p className="mb-2 text-[10px] uppercase tracking-[.22em] text-amber">{previewing && film.youtubeId ? "Muted preview" : film.youtubeId ? "B28 Entertainment" : film.isOriginal ? "ORUN Original" : film.country}</p>
            <h3 className="font-display text-xl leading-tight md:text-2xl">{film.title}</h3>
          </div>
          {film.youtubeId && (
            <button
              type="button"
              className="absolute right-3 top-3 z-30 inline-flex min-h-10 items-center gap-2 rounded-full bg-black/75 px-3 text-xs font-semibold text-white opacity-100 shadow-lg backdrop-blur-md transition hover:bg-amber hover:text-black md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              onClick={() => setExpanded(true)}
              aria-label={`Unmute and play ${film.title}`}
            >
              <Volume2 size={15} /> <span className="sm:hidden">Unmute</span><span className="hidden sm:inline">Unmute &amp; play</span>
            </button>
          )}
          {!film.youtubeId && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-amber text-black"><Play size={18} fill="currentColor" /></span>
            </div>
          )}
        </div>
        <Link href={`/films/${film.slug}`} className="flex items-center justify-between px-3 py-3 text-xs text-white/55 hover:text-white" aria-label={`Open ${film.title} details`}>
          <span>{film.year} · {film.genres[0]}</span>
          <strong className="text-amber">{film.score ? `${film.score}%` : "Film"}</strong>
        </Link>
      </article>

      {expanded && fullPreviewUrl && createPortal(
        <div className="fixed inset-0 z-[100] grid bg-black" role="dialog" aria-modal="true" aria-label={`${film.title} trailer`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[101] flex items-center justify-between gap-4 bg-gradient-to-b from-black/95 to-transparent p-4 pb-12 md:p-7 md:pb-16">
            <Link href={`/films/${film.slug}`} className="pointer-events-auto inline-flex items-center gap-2 font-display text-lg tracking-wide text-white hover:text-amber">
              {film.title} <ExternalLink size={16} />
            </Link>
            <button type="button" autoFocus onClick={() => setExpanded(false)} className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Close trailer">
              <X size={22} />
            </button>
          </div>
          <iframe
            className="relative z-0 h-full w-full"
            src={fullPreviewUrl}
            title={`${film.title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>,
        document.body,
      )}
    </>
  );
}
