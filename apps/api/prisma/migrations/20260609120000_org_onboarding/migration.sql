-- CreateEnum
CREATE TYPE "ClinicSize" AS ENUM ('SIZE_1_5', 'SIZE_6_20', 'SIZE_21_100', 'SIZE_100_PLUS');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Organization" ADD COLUMN "clinicSize" "ClinicSize";

-- Backfill existing organizations so they skip the wizard
UPDATE "Organization" SET "onboardingCompleted" = true, "onboardingStep" = 5;
