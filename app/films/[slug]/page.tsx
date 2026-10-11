import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Plus, Star } from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { FilmRow } from "@/components/film/film-row";
import { films } from "@/server/demo/catalog";

export function generateStaticParams() { return films.map((film) => ({ slug: film.slug })); }

export default async function FilmDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const film = films.find((item) => item.slug === slug);
  if (!film) notFound();
  const artwork = film.posterUrl ? { backgroundImage: `linear-gradient(90deg,rgba(5,7,11,.98),rgba(5,7,11,.72) 55%,rgba(5,7,11,.2)),url(${film.posterUrl})` } : undefined;
  return <AppShell><section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d2747] bg-cover bg-center px-6 py-16 md:px-14 md:py-24" style={artwork}><div className="max-w-3xl"><p className="eyebrow">{film.youtubeId ? "B28 Entertainment" : film.country}</p><h1 className="font-display text-5xl leading-none md:text-7xl">{film.title}</h1><p className="mt-5 text-sm text-white/55">{film.year}{film.runtime > 0 ? ` · ${film.runtime} min` : ""} · {film.ageRating} · {film.genres.join(" / ")}</p><p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{film.synopsis}</p><div className="mt-8 flex flex-wrap gap-3"><Link className="primary-action" href={`/watch/${film.id}`}><Play size={18} fill="currentColor" />Watch</Link><button className="glass-action"><Plus size={18} />My list</button><button className="glass-action"><Star size={18} />Rate</button></div></div></section><div className="grid gap-8 py-12 md:grid-cols-[1fr_2fr]"><div><p className="text-xs uppercase tracking-widest text-white/35">Presented by</p><p className="mt-2">{film.director}</p></div><div><h2 className="font-display text-2xl">About the film</h2><p className="mt-4 leading-7 text-white/55">Temporarily presented on ORUN from the official B28 Entertainment YouTube channel. Playback remains hosted by YouTube and follows YouTube&apos;s availability and embedding settings.</p></div></div><FilmRow title="You may also like" films={films.filter((item) => item.id !== film.id).slice(0, 5)} /></AppShell>;
}
