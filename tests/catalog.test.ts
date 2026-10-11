import { describe, expect, it } from "vitest";
import { films } from "../server/demo/catalog";

describe("temporary B28 catalogue", () => {
  it("contains only unique full-film YouTube entries", () => {
    expect(films).toHaveLength(6);
    expect(new Set(films.map((film) => film.youtubeId)).size).toBe(films.length);
    expect(films.every((film) => film.youtubeId && film.posterUrl?.includes(film.youtubeId))).toBe(true);
    expect(films.some((film) => /trailer|teaser/i.test(film.title))).toBe(false);
  });
});
