-- AlterTable
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "bpjsCardNumber" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "bpjsOcrExtracted" JSONB;
