import type { Film } from "@/server/demo/catalog";

export type FilmRecommendation = { film: Film; score: number; explanation: string };

const stopWords = new Set(["about", "after", "against", "behind", "into", "their", "them", "they", "this", "through", "with", "whose"]);

function words(value: string) {
  return new Set(value.toLowerCase().match(/[a-z]{4,}/g)?.filter((word) => !stopWords.has(word)) ?? []);
}

function overlap(left: Iterable<string>, right: Iterable<string>) {
  const rightSet = new Set(Array.from(right, (value) => value.toLowerCase()));
  return Array.from(left, (value) => value.toLowerCase()).filter((value) => rightSet.has(value));
}

export function recommendFilms(current: Film, catalog: Film[], limit = 5): FilmRecommendation[] {
  const currentWords = words(`${current.synopsis} ${current.moods.join(" ")}`);
  return catalog
    .filter((candidate) => candidate.id !== current.id && Boolean(candidate.youtubeId))
    .map((candidate) => {
      const genres = overlap(current.genres, candidate.genres);
      const themes = overlap(current.moods, candidate.moods);
      const storyWords = overlap(currentWords, words(candidate.synopsis));
      const score = genres.length * 4 + themes.length * 5 + Math.min(storyWords.length, 4) * 2 + (candidate.country === current.country ? 1 : 0);
      const explanation = themes.length
        ? `Shared ${themes.slice(0, 2).join(" and ").toLowerCase()} themes`
        : genres.length
          ? `More ${genres.slice(0, 2).join(" and ").toLowerCase()}`
          : `Another story from ${candidate.country}`;
      return { film: candidate, score, explanation };
    })
    .sort((left, right) => right.score - left.score || right.film.year - left.film.year || left.film.title.localeCompare(right.film.title))
    .slice(0, Math.max(0, limit));
}
