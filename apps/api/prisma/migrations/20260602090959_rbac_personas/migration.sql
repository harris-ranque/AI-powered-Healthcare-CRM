/*
  Warnings:

  - The values [CUSTOMER,VENDOR,ADMIN,STAFF] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('PATIENT', 'CLINIC_OWNER', 'SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST');
ALTER TABLE "public"."OrganizationMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role_new"
USING (
  CASE "role"::text
    WHEN 'CUSTOMER' THEN 'PATIENT'
    WHEN 'VENDOR' THEN 'CLINIC_OWNER'
    WHEN 'ADMIN' THEN 'SUPER_ADMIN'
    WHEN 'STAFF' THEN 'DOCTOR'
    ELSE 'PATIENT'
  END
)::"Role_new";
ALTER TABLE "OrganizationMember"
ALTER COLUMN "role" TYPE "Role_new"
USING (
  CASE "role"::text
    WHEN 'CUSTOMER' THEN 'PATIENT'
    WHEN 'VENDOR' THEN 'CLINIC_OWNER'
    WHEN 'ADMIN' THEN 'SUPER_ADMIN'
    WHEN 'STAFF' THEN 'DOCTOR'
    ELSE 'DOCTOR'
  END
)::"Role_new";
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "OrganizationMember" ALTER COLUMN "role" SET DEFAULT 'DOCTOR';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PATIENT';
COMMIT;

-- AlterTable
ALTER TABLE "OrganizationMember" ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "role" SET DEFAULT 'DOCTOR';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PATIENT';

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_status_idx" ON "OrganizationMember"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
