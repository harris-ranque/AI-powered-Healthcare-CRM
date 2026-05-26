-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "stripeSubscriptionPlan" TEXT,
ADD COLUMN     "stripeSubscriptionStatus" TEXT,
ADD COLUMN     "subscriptionCurrentPeriodEnd" TIMESTAMP(3);
