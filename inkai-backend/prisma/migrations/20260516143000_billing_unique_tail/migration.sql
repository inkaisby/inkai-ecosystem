-- Biaya event: ekor unik untuk pelacakan pembayaran (QRIS statis, mutasi bank)
ALTER TABLE "Billing" ADD COLUMN IF NOT EXISTS "baseFeeAmount" DOUBLE PRECISION;
ALTER TABLE "Billing" ADD COLUMN IF NOT EXISTS "uniqueTail" INTEGER;
