-- AlterTable
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "allowEventWithoutDues" BOOLEAN NOT NULL DEFAULT false;
