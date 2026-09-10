ALTER TABLE "AdReward"
  ADD COLUMN "placement" TEXT,
  ADD COLUMN "ymid" TEXT,
  ADD COLUMN "zoneId" TEXT,
  ADD COLUMN "requestVar" TEXT,
  ADD COLUMN "eventType" TEXT,
  ADD COLUMN "rewardEventType" TEXT,
  ADD COLUMN "subZoneId" TEXT,
  ADD COLUMN "estimatedPrice" DECIMAL(20,8),
  ADD COLUMN "rejectedAt" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "AdReward_ymid_key" ON "AdReward"("ymid");
CREATE INDEX "AdReward_provider_placement_status_expiresAt_idx" ON "AdReward"("provider", "placement", "status", "expiresAt");
