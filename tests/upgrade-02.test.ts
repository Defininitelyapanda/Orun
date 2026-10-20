import { describe, expect, it } from "vitest";
import { films } from "../server/demo/catalog";
import { filterAndSortCatalog } from "../lib/catalog/discovery";
import { confidenceAwareAudienceScore, recommendFilms } from "../lib/recommendations/recommendation-engine";

describe("upgrade 02 catalogue discovery", () => {
  it("combines filters without discarding either selection", () => {
    const result=filterAndSortCatalog(films,{genre:"Drama",theme:"Betrayal",region:"East Africa",yearFrom:"2025",yearTo:"2026"});
    expect(result.map(item=>item.slug)).toEqual(["betrayed"]);
  });
  it("keeps sorting stable with a title tie-breaker", () => {
    const result=filterAndSortCatalog(films,{sort:"year"});
    expect(result.filter(item=>item.year===2026).map(item=>item.title)).toEqual(["Shattered","Threshold"]);
  });
});

describe("confidence-aware recommendations", () => {
  it("does not treat two perfect ratings as stronger than a large established sample", () => {
    expect(confidenceAwareAudienceScore(4.7,500)).toBeGreaterThan(confidenceAwareAudienceScore(5,2));
  });
  it("accepts distinct viewer preference signals", () => {
    const recommendations=recommendFilms(films[0]!,films,3,{preferredThemes:["Betrayal"],ratings:{[films[2]!.id]:5}});
    expect(recommendations).toHaveLength(3);
    expect(recommendations.every(item=>Number.isFinite(item.score))).toBe(true);
  });
});
