import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { filterAndSortCatalog } from "../lib/catalog/discovery";
import { canonicalGenres,contentFormats,genreGroups,searchGenres,storyThemes,taxonomySlug,tones } from "../lib/taxonomy/catalog";
import { films } from "../server/demo/catalog";

describe("upgrade 04 canonical taxonomy",()=>{
 it("contains every broad group and de-duplicates repeated canonical genre labels",()=>{expect(genreGroups).toHaveLength(22);expect(canonicalGenres.length).toBeGreaterThan(300);expect(new Set(canonicalGenres.map(item=>item.slug)).size).toBe(canonicalGenres.length)});
 it("keeps formats, themes and tones separate from genres",()=>{expect(contentFormats).toContain("Short Film");expect(storyThemes).toContain("Tradition versus Modernity");expect(tones).toContain("Slow-Burn");expect(canonicalGenres.some(item=>item.name==="Short Film")).toBe(false)});
 it("uses stable slugs and recognizes supported search synonyms",()=>{expect(taxonomySlug("LGBTQ+ Stories")).toBe("lgbtq-stories");expect(searchGenres("sci-fi").map(item=>item.name)).toContain("Science Fiction");expect(searchGenres("romcom").map(item=>item.name)).toContain("Romantic Comedy")});
});

describe("upgrade 04 discovery behavior",()=>{
 it("supports explicit AND and OR multi-genre logic",()=>{expect(filterAndSortCatalog(films,{genre:["Drama","Romance"],genreLogic:"and"}).map(item=>item.slug)).toEqual(["threshold","fragile-hearts"]);expect(filterAndSortCatalog(films,{genre:["Romance","Short Films"],genreLogic:"or"}).length).toBeGreaterThan(2)});
 it("combines classification, origin, language and quality filters",()=>{expect(filterAndSortCatalog(films,{theme:"Coming of Age",tone:"Romantic",country:"Kenya",language:"English",quality:"720p"}).map(item=>item.slug)).toEqual(["threshold"])});
});

describe("upgrade 04 persistence and authorization contracts",()=>{
 const migration=readFileSync("prisma/migrations/20261020170000_comprehensive_taxonomy/migration.sql","utf8");
 const adminRoute=readFileSync("app/api/admin/taxonomy/route.ts","utf8");
 const creatorRoute=readFileSync("app/api/creator/catalog/[slug]/classification/route.ts","utf8");
 it("migrates existing assignments before enforcing one primary genre",()=>{expect(migration).toContain("Preserve every existing assignment");expect(migration).toContain("FilmGenre_one_primary_per_film_idx");expect(migration).toContain("ClassificationSuggestion")});
 it("protects taxonomy mutations and limits creators to authorized title suggestions",()=>{expect(adminRoute).toContain('requireAdmin("catalog:write")');expect(adminRoute).toContain("confirmationRequired");expect(creatorRoute).toContain("recipient?.userId!==session.user.id");expect(creatorRoute).toContain('status:"PENDING_REVIEW"')});
});
