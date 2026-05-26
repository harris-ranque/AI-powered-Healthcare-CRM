-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "apiLimitPerMonth" INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN     "memberLimit" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "storageLimitMb" INTEGER NOT NULL DEFAULT 1024,
ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE';
