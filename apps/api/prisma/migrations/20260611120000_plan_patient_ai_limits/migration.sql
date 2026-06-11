-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "patientLimit" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Organization" ADD COLUMN "aiRequestLimitPerMonth" INTEGER NOT NULL DEFAULT 20;

-- Backfill limits by subscription plan (spec tiers)
UPDATE "Organization" SET
  "memberLimit" = 2,
  "patientLimit" = 50,
  "aiRequestLimitPerMonth" = 20
WHERE "subscriptionPlan" = 'FREE';

UPDATE "Organization" SET
  "memberLimit" = 5,
  "patientLimit" = 500,
  "aiRequestLimitPerMonth" = 100
WHERE "subscriptionPlan" = 'STARTER';

UPDATE "Organization" SET
  "memberLimit" = 25,
  "patientLimit" = 5000,
  "aiRequestLimitPerMonth" = 5000
WHERE "subscriptionPlan" = 'PROFESSIONAL';

UPDATE "Organization" SET
  "memberLimit" = 2147483647,
  "patientLimit" = 2147483647,
  "aiRequestLimitPerMonth" = 2147483647
WHERE "subscriptionPlan" = 'ENTERPRISE';
