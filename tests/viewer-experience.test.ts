import { describe, expect, it } from "vitest";
import { films } from "../server/demo/catalog";
import { recommendFilms } from "../lib/recommendations/recommendation-engine";
import { createWatchProgress, formatPlaybackTime, getWatchState } from "../lib/viewer/watch-history";

describe("viewer watch history", () => {
  it("distinguishes meaningful progress from completed playback", () => {
    expect(getWatchState(2, 100)).toBe("not-watched");
    expect(getWatchState(50, 100)).toBe("in-progress");
    expect(getWatchState(90, 100)).toBe("watched");
    expect(createWatchProgress("film", 95, 100).completed).toBe(true);
  });

  it("formats timestamps for resume prompts", () => {
    expect(formatPlaybackTime(65)).toBe("1:05");
    expect(formatPlaybackTime(3661)).toBe("1:01:01");
  });
});

describe("catalog recommendations", () => {
  it("uses real metadata and excludes the current film", () => {
    const recommendations = recommendFilms(films[0]!, films, 3);
    expect(recommendations).toHaveLength(3);
    expect(recommendations.every(({ film }) => film.id !== films[0]!.id && films.includes(film))).toBe(true);
    expect(recommendations[0]!.score).toBeGreaterThanOrEqual(recommendations[1]!.score);
  });
});
