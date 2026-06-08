-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "status" TYPE "AppointmentStatus" USING ("status"::"AppointmentStatus");
ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

ALTER TABLE "Appointment" ALTER COLUMN "endsAt" SET NOT NULL;

ALTER TABLE "Appointment" ADD COLUMN "title" TEXT;

-- CreateIndex
CREATE INDEX "Appointment_providerId_startsAt_idx" ON "Appointment"("providerId", "startsAt");
