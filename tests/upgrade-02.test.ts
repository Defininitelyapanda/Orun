import { describe, expect, it } from "vitest";
import { films } from "../server/demo/catalog";
import { filterAndSortCatalog } from "../lib/catalog/discovery";
import { confidenceAwareAudienceScore, recommendFilms } from "../lib/recommendations/recommendation-engine";
import { previewPosition } from "../lib/viewer/preview-position";

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

describe("upgrade 03 preview positioning",()=>{
  it("places previews to the left when a card is near the right edge",()=>{const position=previewPosition({left:900,right:1100,top:200},{width:1200,height:800});expect(position.left).toBeLessThan(900);expect(position.left+position.width).toBeLessThanOrEqual(1188)});
  it("clamps previews inside narrow and short viewports",()=>{const position=previewPosition({left:4,right:160,top:700},{width:360,height:640});expect(position.left).toBeGreaterThanOrEqual(12);expect(position.top).toBeGreaterThanOrEqual(12);expect(position.left+position.width).toBeLessThanOrEqual(348)});
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
