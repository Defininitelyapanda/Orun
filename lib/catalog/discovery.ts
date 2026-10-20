import type { Film } from "@/server/demo/catalog";
import { searchGenres } from "@/lib/taxonomy/catalog";

export type CatalogQuery = { q?: string; genre?: string | string[]; genreLogic?: "and"|"or"; theme?: string | string[]; tone?: string | string[]; region?: string; country?: string; format?: string; language?: string; access?: string; ageRating?: string; quality?: string; rating?: string; yearFrom?: string; yearTo?: string; duration?: string; sort?: string; page?: string };
const values = (value?: string | string[]) => value ? (Array.isArray(value) ? value : [value]) : [];

export function filterAndSortCatalog(catalog: Film[], query: CatalogQuery) {
  const genres = values(query.genre);
  const themes = values(query.theme);
  const tones = values(query.tone);
  const from = Number(query.yearFrom) || 0;
  const to = Number(query.yearTo) || 9999;
  const needle = query.q?.trim().toLowerCase();
  const searchGenreNames=needle?new Set(searchGenres(needle).map(item=>item.name)):new Set<string>();
  const filtered = catalog.filter(film =>
    (!needle || `${film.title} ${film.synopsis} ${film.director} ${film.genres.join(" ")} ${film.themes.join(" ")}`.toLowerCase().includes(needle) || film.genres.some(genre=>searchGenreNames.has(genre))) &&
    (!genres.length || (query.genreLogic==="or"?genres.some(genre=>film.genres.includes(genre)):genres.every(genre => film.genres.includes(genre)))) &&
    (!themes.length || themes.every(theme => film.themes.includes(theme))) &&
    (!tones.length || tones.every(tone=>film.moods.includes(tone))) &&
    (!query.region || film.region === query.region || film.country === query.region) &&
    (!query.country || film.country===query.country) &&
    (!query.format || film.contentFormat === query.format) &&
    (!query.language || [...film.audioLanguages, ...film.subtitleLanguages].includes(query.language)) &&
    (!query.ageRating || film.ageRating===query.ageRating) &&
    (!query.quality || film.videoQualities.includes(query.quality)) &&
    (!query.rating || (film.score??0)>=Number(query.rating)) &&
    (!query.access || film.access === query.access) && film.year >= from && film.year <= to &&
    (!query.duration || (query.duration === "short" ? film.runtime > 0 && film.runtime < 40 : query.duration === "feature" ? film.runtime >= 40 : true))
  );
  const sort = query.sort ?? "recommended";
  return filtered.sort((left, right) => {
    if (sort === "popular" || sort === "recommended") return right.popularity - left.popularity || left.title.localeCompare(right.title);
    if (sort === "trending") return Number(Boolean(right.trending)) - Number(Boolean(left.trending)) || right.popularity - left.popularity || left.title.localeCompare(right.title);
    if (sort === "highest-rated") return (right.score ?? -1) - (left.score ?? -1) || right.popularity - left.popularity || left.title.localeCompare(right.title);
    if (sort === "most-rated") return right.popularity - left.popularity || left.title.localeCompare(right.title);
    if (sort === "recently-added") return right.addedAt.localeCompare(left.addedAt) || left.title.localeCompare(right.title);
    if (sort === "year") return right.year - left.year || left.title.localeCompare(right.title);
    if (sort === "alphabetical") return left.title.localeCompare(right.title);
    if (sort === "shortest") return (left.runtime || 9999) - (right.runtime || 9999) || left.title.localeCompare(right.title);
    if (sort === "longest") return right.runtime - left.runtime || left.title.localeCompare(right.title);
    return left.title.localeCompare(right.title);
  });
}
