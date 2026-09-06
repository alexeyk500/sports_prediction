-- Add canonical Goalstery asset slugs for local football presentation assets.
ALTER TABLE "Competition" ADD COLUMN "slug" TEXT;
ALTER TABLE "Team" ADD COLUMN "slug" TEXT;

WITH normalized AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        REGEXP_REPLACE(
          REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g'),
          '(^-|-$)',
          '',
          'g'
        ),
        ''
      ),
      'competition'
    ) AS base_slug
  FROM "Competition"
),
ranked AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS slug_rank
  FROM normalized
)
UPDATE "Competition"
SET "slug" = CASE
  WHEN ranked.slug_rank = 1 THEN ranked.base_slug
  ELSE ranked.base_slug || '-' || ranked.slug_rank::TEXT
END
FROM ranked
WHERE "Competition".id = ranked.id;

WITH normalized AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        REGEXP_REPLACE(
          REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g'),
          '(^-|-$)',
          '',
          'g'
        ),
        ''
      ),
      'team'
    ) AS base_slug
  FROM "Team"
),
ranked AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS slug_rank
  FROM normalized
)
UPDATE "Team"
SET "slug" = CASE
  WHEN ranked.slug_rank = 1 THEN ranked.base_slug
  ELSE ranked.base_slug || '-' || ranked.slug_rank::TEXT
END
FROM ranked
WHERE "Team".id = ranked.id;

ALTER TABLE "Competition" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Team" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
