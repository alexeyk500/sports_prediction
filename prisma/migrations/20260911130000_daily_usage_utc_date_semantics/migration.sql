WITH computed_usage AS (
  SELECT
    p."userId",
    (f."kickoffAt" AT TIME ZONE 'UTC')::date AS "utcDate",
    COUNT(*)::int AS "totalUsed"
  FROM "Prediction" p
  INNER JOIN "Fixture" f ON f.id = p."fixtureId"
  GROUP BY p."userId", (f."kickoffAt" AT TIME ZONE 'UTC')::date
),
updated_usage AS (
  INSERT INTO "DailyPredictionUsage" (
    "id",
    "userId",
    "businessDate",
    "freeUsed",
    "rewardedUsed",
    "createdAt",
    "updatedAt"
  )
  SELECT
    gen_random_uuid(),
    "userId",
    "utcDate",
    LEAST("totalUsed", 3),
    GREATEST("totalUsed" - 3, 0),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM computed_usage
  ON CONFLICT ("userId", "businessDate") DO UPDATE
  SET
    "freeUsed" = EXCLUDED."freeUsed",
    "rewardedUsed" = EXCLUDED."rewardedUsed",
    "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "userId", "businessDate"
)
DELETE FROM "DailyPredictionUsage" dpu
WHERE NOT EXISTS (
  SELECT 1
  FROM updated_usage uu
  WHERE uu."userId" = dpu."userId"
    AND uu."businessDate" = dpu."businessDate"
)
AND EXISTS (
  SELECT 1
  FROM "Prediction" p
  WHERE p."userId" = dpu."userId"
);

