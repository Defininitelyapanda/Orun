import Link from "next/link";
import { Play } from "lucide-react";
import type { Film } from "@/server/demo/catalog";

const gradients = ["from-[#5a2d20] via-[#1c3148] to-[#07101a]", "from-[#143a45] via-[#1c253f] to-[#080b12]", "from-[#50381d] via-[#282330] to-[#07090e]", "from-[#2b193d] via-[#122e45] to-[#06090e]", "from-[#15372e] via-[#19253e] to-[#06080d]"];

export function FilmCard({ film, index = 0 }: { film: Film; index?: number }) {
  const posterStyle = film.posterUrl ? { backgroundImage: `linear-gradient(to top,rgba(5,7,11,.96),rgba(5,7,11,.04) 72%),url(${film.posterUrl})` } : undefined;
  return <article className="group relative w-[44vw] min-w-[160px] max-w-[250px] flex-none overflow-hidden rounded-xl border border-white/8 bg-[#0b111b] shadow-2xl md:w-[19vw]"><Link href={`/films/${film.slug}`} aria-label={`View ${film.title}`}><div className={`relative aspect-[2/3] bg-gradient-to-br bg-cover bg-center ${gradients[index % gradients.length]}`} style={posterStyle}><div className="absolute inset-x-4 bottom-5"><p className="mb-2 text-[10px] uppercase tracking-[.22em] text-amber">{film.youtubeId ? "B28 Entertainment" : film.isOriginal ? "ORUN Original" : film.country}</p><h3 className="font-display text-xl leading-tight md:text-2xl">{film.title}</h3></div><div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100"><span className="grid h-12 w-12 place-items-center rounded-full bg-amber text-black"><Play size={18} fill="currentColor" /></span></div></div><div className="flex items-center justify-between px-3 py-3 text-xs text-white/55"><span>{film.year} · {film.genres[0]}</span><strong className="text-amber">{film.score ? `${film.score}%` : "YouTube"}</strong></div></Link></article>;
}
