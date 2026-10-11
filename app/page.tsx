import Link from "next/link";
import { Play, Plus, Sparkles } from "lucide-react";
import { Navbar } from "@/components/navigation/navbar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { FilmRow } from "@/components/film/film-row";
import { films, homeSections } from "@/server/demo/catalog";

export default function Home() {
  const hero = films[0]!;
  return (
    <main className="min-h-screen overflow-hidden bg-background pb-24 text-foreground md:pb-0">
      <Navbar />
      <section className="hero relative flex min-h-[88svh] items-end overflow-hidden px-5 pb-16 pt-28 md:min-h-[92vh] md:px-12 md:pb-24 lg:px-20">
        <div className="hero-art absolute inset-0" style={hero.posterUrl ? { backgroundImage: `url(${hero.posterUrl})` } : undefined} /><div className="hero-shade absolute inset-0" />
        <div className="relative z-10 max-w-2xl animate-reveal">
          <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-amber"><span className="h-px w-8 bg-amber" /> B28 Entertainment on ORUN</div>
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[.86] tracking-[-.04em]">{hero.title}</h1>
          <p className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className="rounded border border-white/20 px-2 py-1 text-white">{hero.ageRating}</span><span>{hero.year}</span>{hero.runtime > 0 && <span>{hero.runtime} min</span>}<span>{hero.genres.join(" · ")}</span><strong className="text-amber">Streaming from YouTube</strong></p>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75 md:text-lg">{hero.synopsis}</p>
          <div className="mt-8 flex items-center gap-3"><Link className="primary-action" href={`/watch/${hero.id}`}><Play size={18} fill="currentColor" /> Watch now</Link><button className="glass-action" aria-label={`Add ${hero.title} to My List`}><Plus size={19} /> My list</button></div>
        </div>
        <div className="absolute bottom-7 right-8 z-10 hidden items-center gap-3 text-xs uppercase tracking-[.2em] text-white/45 lg:flex"><span className="h-px w-14 bg-white/25" /> Scroll to discover</div>
      </section>
      <div className="relative z-20 -mt-5 space-y-14 pb-24 md:-mt-10 md:space-y-20">
        <section className="px-5 md:px-12 lg:px-20"><div className="mood-panel"><div><p className="eyebrow"><Sparkles size={14} /> ORUN Mood</p><h2 className="font-display text-2xl md:text-3xl">What are you in the mood for?</h2></div><div className="flex flex-wrap gap-2">{["Emotional","Intense","Funny","Cultural","Short watch"].map((mood) => <Link key={mood} href={`/discover?mood=${encodeURIComponent(mood)}`} className="mood-chip">{mood}</Link>)}</div></div></section>
        {homeSections.map((section) => <FilmRow key={section.title} title={section.title} kicker={section.kicker} films={section.filmIds.map((id) => films.find((film) => film.id === id)).filter(Boolean) as typeof films} />)}
      </div>
      <footer className="border-t border-white/8 px-5 py-12 text-sm text-white/45 md:px-12 lg:px-20"><div className="flex flex-col justify-between gap-6 md:flex-row"><div><p className="font-display text-2xl tracking-[.18em] text-white">ORUN</p><p className="mt-2">Cinema Beyond Boundaries.</p></div><nav className="flex flex-wrap gap-6"><Link href="/about">About</Link><Link href="/help">Help</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></nav></div></footer>
      <MobileNav />
    </main>
  );
}
