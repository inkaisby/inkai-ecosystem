import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Adding photoUrl column to User table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
    `);
    console.log('Manual migration for photoUrl finished successfully.');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
