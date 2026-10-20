import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Navbar } from "@/components/navigation/navbar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { FilmRow } from "@/components/film/film-row";
import { ContinueWatchingRow } from "@/components/film/continue-watching-row";
import { RankedFilmRow } from "@/components/film/ranked-film-row";
import { films, homeSections } from "@/server/demo/catalog";
import { HeroCarousel } from "@/components/film/hero-carousel";

export default function Home() {
  const heroItems = films.filter((film) => film.featured || film.trending).slice(0, 5);
  return (
    <main className="min-h-screen overflow-hidden bg-background pb-24 text-foreground md:pb-0">
      <Navbar />
      <HeroCarousel items={heroItems.length ? heroItems : films.slice(0, 3)} />
      <div className="relative z-20 -mt-5 space-y-14 pb-24 md:-mt-10 md:space-y-20">
        <section className="px-5 md:px-12 lg:px-20"><div className="mood-panel"><div><p className="eyebrow"><Sparkles size={14} /> ORUN Mood</p><h2 className="font-display text-2xl md:text-3xl">What are you in the mood for?</h2></div><div className="flex flex-wrap gap-2">{["Emotional","Intense","Funny","Cultural","Short watch"].map((mood) => <Link key={mood} href={`/discover?mood=${encodeURIComponent(mood)}`} className="mood-chip">{mood}</Link>)}</div></div></section>
        <ContinueWatchingRow />
        <RankedFilmRow films={[...films].sort((left, right) => right.year - left.year || left.title.localeCompare(right.title))} />
        {homeSections.map((section) => <FilmRow key={section.title} title={section.title} kicker={section.kicker} films={section.filmIds.map((id) => films.find((film) => film.id === id)).filter(Boolean) as typeof films} />)}
        <section className="mx-5 grid gap-4 md:mx-12 md:grid-cols-2 lg:mx-20"><article className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><p className="eyebrow">Kenya chart status</p><h2 className="font-display text-2xl">Building a trustworthy Top 10</h2><p className="mt-3 text-sm leading-6 text-white/50">ORUN will publish engagement-based rankings only after qualified, deduplicated viewing data is available. Until then, the chart above is explicitly editorial.</p></article><article className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><p className="eyebrow">Worldwide chart status</p><h2 className="font-display text-2xl">More regions coming online</h2><p className="mt-3 text-sm leading-6 text-white/50">The current temporary catalogue does not contain enough global activity or regional availability data for a credible worldwide chart. No global viewing figures are fabricated.</p></article></section>
      </div>
      <MobileNav />
    </main>
  );
}
