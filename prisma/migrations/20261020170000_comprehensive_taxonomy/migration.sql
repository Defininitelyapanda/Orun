-- Upgrade 04: normalized, hierarchical and migration-safe classification.
ALTER TABLE "Film"
  ADD COLUMN "culturalContext" TEXT,
  ADD COLUMN "filmingLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "productionStatus" TEXT NOT NULL DEFAULT 'RELEASED',
  ADD COLUMN "productionCompany" TEXT,
  ADD COLUMN "originalReleaseDate" TIMESTAMP(3),
  ADD COLUMN "awards" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "festivalSelections" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "aspectRatio" TEXT,
  ADD COLUMN "closedCaptions" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "audioDescription" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "signLanguageInterpretation" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Genre"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "parentId" TEXT,
  ADD COLUMN "localizedNames" JSONB,
  ADD COLUMN "synonyms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "recommendationTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "publicVisible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "artworkUrl" TEXT,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "mergedIntoId" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "FilmGenre"
  ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'EDITORIAL',
  ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "StoryTheme"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "synonyms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "publicVisible" BOOLEAN NOT NULL DEFAULT true;

-- Preserve every existing assignment and promote one deterministic genre per title.
WITH ranked AS (
  SELECT "filmId", "genreId", ROW_NUMBER() OVER (PARTITION BY "filmId" ORDER BY "genreId") AS position
  FROM "FilmGenre"
)
UPDATE "FilmGenre" fg SET "isPrimary" = true
FROM ranked WHERE ranked."filmId" = fg."filmId" AND ranked."genreId" = fg."genreId" AND ranked.position = 1;

CREATE TABLE "Tone" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "publicVisible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE "FilmTone" (
  "filmId" TEXT NOT NULL,
  "toneId" TEXT NOT NULL,
  PRIMARY KEY ("filmId", "toneId")
);
CREATE TABLE "ContentFormatTaxon" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "publicVisible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE "FilmFormat" (
  "filmId" TEXT NOT NULL,
  "formatId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY ("filmId", "formatId")
);
CREATE TABLE "FilmCountry" (
  "filmId" TEXT NOT NULL,
  "countryId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY ("filmId", "countryId")
);
CREATE TABLE "FilmLanguage" (
  "filmId" TEXT NOT NULL,
  "languageId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "isOriginal" BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY ("filmId", "languageId", "kind")
);
CREATE TABLE "ClassificationSystem" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "territoryCode" VARCHAR(2),
  "labels" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE "FilmAudienceClassification" (
  "filmId" TEXT NOT NULL,
  "systemId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "advisories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  PRIMARY KEY ("filmId", "systemId")
);
CREATE TABLE "ClassificationSuggestion" (
  "id" TEXT PRIMARY KEY,
  "filmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "valueId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "moderationNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Genre_parentId_active_publicVisible_sortOrder_idx" ON "Genre"("parentId", "active", "publicVisible", "sortOrder");
CREATE INDEX "Genre_featured_active_sortOrder_idx" ON "Genre"("featured", "active", "sortOrder");
CREATE INDEX "FilmGenre_filmId_isPrimary_idx" ON "FilmGenre"("filmId", "isPrimary");
CREATE UNIQUE INDEX "FilmGenre_one_primary_per_film_idx" ON "FilmGenre"("filmId") WHERE "isPrimary" = true;
CREATE INDEX "FilmTone_toneId_filmId_idx" ON "FilmTone"("toneId", "filmId");
CREATE INDEX "FilmFormat_formatId_filmId_idx" ON "FilmFormat"("formatId", "filmId");
CREATE INDEX "FilmFormat_filmId_isPrimary_idx" ON "FilmFormat"("filmId", "isPrimary");
CREATE UNIQUE INDEX "FilmFormat_one_primary_per_film_idx" ON "FilmFormat"("filmId") WHERE "isPrimary" = true;
CREATE INDEX "FilmCountry_countryId_filmId_idx" ON "FilmCountry"("countryId", "filmId");
CREATE INDEX "FilmLanguage_languageId_kind_filmId_idx" ON "FilmLanguage"("languageId", "kind", "filmId");
CREATE INDEX "FilmAudienceClassification_systemId_label_filmId_idx" ON "FilmAudienceClassification"("systemId", "label", "filmId");
CREATE UNIQUE INDEX "ClassificationSuggestion_filmId_userId_kind_valueId_key" ON "ClassificationSuggestion"("filmId", "userId", "kind", "valueId");
CREATE INDEX "ClassificationSuggestion_status_createdAt_idx" ON "ClassificationSuggestion"("status", "createdAt");
CREATE INDEX "ClassificationSuggestion_filmId_status_idx" ON "ClassificationSuggestion"("filmId", "status");

-- Normalize the existing scalar format without removing it, keeping backward compatibility.
INSERT INTO "ContentFormatTaxon" ("id", "slug", "name", "sortOrder")
SELECT 'format_' || md5("contentFormat"), lower(regexp_replace("contentFormat", '[^a-zA-Z0-9]+', '-', 'g')), initcap(replace("contentFormat", '_', ' ')), 0
FROM "Film" GROUP BY "contentFormat"
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "FilmFormat" ("filmId", "formatId", "isPrimary")
SELECT film."id", format."id", true
FROM "Film" film
JOIN "ContentFormatTaxon" format ON format."slug" = lower(regexp_replace(film."contentFormat", '[^a-zA-Z0-9]+', '-', 'g'))
ON CONFLICT DO NOTHING;
