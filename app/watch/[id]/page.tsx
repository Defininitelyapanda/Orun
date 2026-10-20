import { notFound } from "next/navigation";
import { OrunPlayer } from "@/components/player/orun-player";
import { YouTubePlayer } from "@/components/player/youtube-player";
import { recommendFilms } from "@/lib/recommendations/recommendation-engine";
import { films } from "@/server/demo/catalog";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const film = films.find((item) => item.id === id);
  if (!film) notFound();
  const recommendation = recommendFilms(film, films, 1)[0]?.film;
  return <main className="grid min-h-screen place-items-center bg-black"><div className="w-full max-w-6xl">{film.youtubeId ? <YouTubePlayer videoId={film.youtubeId} title={film.title} mediaId={film.id} filmSlug={film.slug} recommendation={recommendation} /> : <OrunPlayer title={film.title} poster={film.posterUrl ?? "/images/orun-hero.png"} />}<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-white/55"><div><span className="text-white">{film.title}</span><span className="ml-3 text-xs">Space: play/pause · ←/→: seek · F: fullscreen</span></div><div className="flex items-center gap-4"><Link className="flex items-center gap-2 text-amber hover:underline" href={`/films/${film.slug}#comments`}><MessageCircle size={16}/>Comments &amp; Reviews</Link>{film.youtubeId && <a className="text-amber hover:underline" href={`https://www.youtube.com/watch?v=${film.youtubeId}`} target="_blank" rel="noreferrer">Open on YouTube</a>}</div></div></div></main>;
}
