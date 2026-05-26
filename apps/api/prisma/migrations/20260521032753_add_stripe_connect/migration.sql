-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;
