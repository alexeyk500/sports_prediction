ALTER TYPE "FixtureStatus" ADD VALUE 'POSTPONED';
ALTER TYPE "FixtureStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "FixtureStatus" ADD VALUE 'SUSPENDED';

CREATE TABLE "OutboxEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "eventType" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" UUID NOT NULL,
  "payload" JSONB NOT NULL,
  "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OutboxEvent"
  ADD CONSTRAINT "OutboxEvent_aggregateId_fkey"
  FOREIGN KEY ("aggregateId") REFERENCES "Fixture"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "OutboxEvent_processedAt_occurredAt_idx" ON "OutboxEvent"("processedAt", "occurredAt");
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_occurredAt_idx" ON "OutboxEvent"("aggregateType", "aggregateId", "occurredAt");
CREATE INDEX "OutboxEvent_eventType_occurredAt_idx" ON "OutboxEvent"("eventType", "occurredAt");

UPDATE "Competition"
SET "providerCompetitionId" = CASE "code"
  WHEN 'EPL' THEN '2021'
  WHEN 'LALIGA' THEN '2014'
  WHEN 'SERIE_A' THEN '2019'
  WHEN 'BUNDESLIGA' THEN '2002'
  WHEN 'LIGUE_1' THEN '2015'
  WHEN 'UCL' THEN '2001'
  WHEN 'UEL' THEN '2146'
  ELSE "providerCompetitionId"
END
WHERE "code" IN ('EPL', 'LALIGA', 'SERIE_A', 'BUNDESLIGA', 'LIGUE_1', 'UCL', 'UEL');
