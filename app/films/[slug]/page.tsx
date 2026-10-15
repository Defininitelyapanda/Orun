import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Plus, Star } from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { FilmRow } from "@/components/film/film-row";
import { FilmShareButton } from "@/components/film/film-share-button";
import { recommendFilms } from "@/lib/recommendations/recommendation-engine";
import { films } from "@/server/demo/catalog";

export function generateStaticParams() { return films.map((film) => ({ slug: film.slug })); }

export default async function FilmDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const film = films.find((item) => item.slug === slug);
  if (!film) notFound();
  const recommendations = recommendFilms(film, films, 5);
  const artwork = film.posterUrl ? { backgroundImage: `linear-gradient(90deg,rgba(5,7,11,.98),rgba(5,7,11,.72) 55%,rgba(5,7,11,.2)),url(${film.posterUrl})` } : undefined;
  return <AppShell><section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d2747] bg-cover bg-center px-6 py-16 md:px-14 md:py-24" style={artwork}><div className="max-w-3xl"><p className="eyebrow">{film.youtubeId ? "B28 Entertainment" : film.country}</p><h1 className="font-display text-5xl leading-none md:text-7xl">{film.title}</h1><p className="mt-5 text-sm text-white/55">{film.year}{film.runtime > 0 ? ` · ${film.runtime} min` : ""} · {film.ageRating} · {film.genres.join(" / ")}</p><p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{film.synopsis}</p><div className="mt-8 flex flex-wrap gap-3"><Link className="primary-action" href={`/watch/${film.id}`}><Play size={18} fill="currentColor" />Watch</Link><button className="glass-action"><Plus size={18} />My list</button><button className="glass-action"><Star size={18} />Rate</button><FilmShareButton title={film.title} /></div></div></section><div className="grid gap-8 py-12 md:grid-cols-[1fr_2fr]"><div><p className="text-xs uppercase tracking-widest text-white/35">Presented by</p><p className="mt-2">{film.director}</p></div><div><h2 className="font-display text-2xl">About the film</h2><p className="mt-4 leading-7 text-white/55">Temporarily presented on ORUN from the official B28 Entertainment YouTube channel. Playback remains hosted by YouTube and follows YouTube&apos;s availability and embedding settings.</p><div className="mt-5 rounded-xl border border-white/10 bg-white/[.035] p-4 text-sm leading-6 text-white/50"><strong className="text-white">Offline viewing:</strong> Not available for this externally hosted title. ORUN does not copy or cache films without an authorized offline rendition and entitlement.</div></div></div>{recommendations.length > 0 && <><div className="mb-5 px-1"><p className="eyebrow">Metadata-based discovery</p><p className="text-sm text-white/45">{recommendations[0]!.explanation}; recommendations use the catalogue&apos;s real genres, moods, and synopsis metadata.</p></div><FilmRow title="Recommended" films={recommendations.map(({ film: item }) => item)} /></>}</AppShell>;
}
