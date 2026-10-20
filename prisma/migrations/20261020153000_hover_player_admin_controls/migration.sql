ALTER TABLE "Film"
  ADD COLUMN "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "ratingsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "trailersEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "heroOrder" INTEGER,
  ADD COLUMN "heroDisplaySeconds" INTEGER;

CREATE INDEX "Film_featured_heroOrder_idx" ON "Film"("featured", "heroOrder");
