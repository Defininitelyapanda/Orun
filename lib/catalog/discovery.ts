import type { Film } from "@/server/demo/catalog";

export type CatalogQuery = { q?: string; genre?: string | string[]; theme?: string | string[]; region?: string; format?: string; language?: string; access?: string; yearFrom?: string; yearTo?: string; duration?: string; sort?: string; page?: string };
const values = (value?: string | string[]) => value ? (Array.isArray(value) ? value : [value]) : [];

export function filterAndSortCatalog(catalog: Film[], query: CatalogQuery) {
  const genres = values(query.genre);
  const themes = values(query.theme);
  const from = Number(query.yearFrom) || 0;
  const to = Number(query.yearTo) || 9999;
  const needle = query.q?.trim().toLowerCase();
  const filtered = catalog.filter(film =>
    (!needle || `${film.title} ${film.synopsis} ${film.director}`.toLowerCase().includes(needle)) &&
    (!genres.length || genres.every(genre => film.genres.includes(genre))) &&
    (!themes.length || themes.every(theme => film.themes.includes(theme))) &&
    (!query.region || film.region === query.region || film.country === query.region) &&
    (!query.format || film.contentFormat === query.format) &&
    (!query.language || [...film.audioLanguages, ...film.subtitleLanguages].includes(query.language)) &&
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
