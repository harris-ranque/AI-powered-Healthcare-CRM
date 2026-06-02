-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- DropIndex (schema-level unique replaced by a partial unique index below)
DROP INDEX "Patient_organizationId_email_key";

-- CreateIndex
CREATE INDEX "Patient_organizationId_deletedAt_idx" ON "Patient"("organizationId", "deletedAt");

-- Partial unique index: enforce one active patient per (organization, email)
-- while allowing soft-deleted rows to coexist and email to be reused after delete.
CREATE UNIQUE INDEX "Patient_org_email_active_key"
  ON "Patient" ("organizationId", "email")
  WHERE "deletedAt" IS NULL AND "email" IS NOT NULL;
