import { FilmCard } from "./film-card";
import type { Film } from "@/server/demo/catalog";

export function RankedFilmRow({ films }: { films: Film[] }) {
  if (!films.length) return null;
  return <section aria-labelledby="emerging-kenya-title"><div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-5 md:px-12 lg:px-20"><div><p className="eyebrow">Editorial chart · not viewing statistics</p><h2 id="emerging-kenya-title" className="font-display text-2xl md:text-3xl">Emerging on ORUN · Kenya</h2></div><p className="max-w-md text-xs leading-5 text-white/40">A temporary editorial ranking of the available Kenyan catalogue. Engagement-based Top 10 begins only when verified ORUN viewing data is sufficient.</p></div><div className="scrollbar-none flex gap-5 overflow-x-auto px-5 pb-4 md:px-12 lg:px-20">{films.map((film, index) => <div key={film.id} className="flex flex-none items-end"><span className="pointer-events-none -mr-2 font-display text-[7rem] leading-[.75] text-transparent [-webkit-text-stroke:2px_rgba(214,154,58,.55)] md:text-[9rem]">{index + 1}</span><FilmCard film={film} index={index} /></div>)}</div></section>;
}
