import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log('Using URL for migration:', url?.split('@')[1]); // Log host only for safety

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });

  try {
    console.log('Adding Payment.proofUrl...');
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "proofUrl" TEXT;');
      console.log('OK: Payment.proofUrl added or already exists.');
    } catch (e: any) {
      console.error('FAILED Payment.proofUrl:', e.message);
    }

    console.log('Adding Billing.baseFeeAmount and uniqueTail...');
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "Billing" ADD COLUMN IF NOT EXISTS "baseFeeAmount" DOUBLE PRECISION;');
      await prisma.$executeRawUnsafe('ALTER TABLE "Billing" ADD COLUMN IF NOT EXISTS "uniqueTail" INTEGER;');
      console.log('OK: Billing columns added or already exist.');
    } catch (e: any) {
      console.error('FAILED Billing columns:', e.message);
    }

    console.log('Schema sync finished.');
  } catch (error) {
    console.error('Critical failure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
