import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Adding document columns to Member table...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Member" 
      ADD COLUMN IF NOT EXISTS "birthCertificateUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "bpjsCardUrl" TEXT;
    `);

    console.log('Manual migration for documents finished successfully.');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
