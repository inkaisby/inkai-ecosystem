import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

async function testEnvConnection() {
  console.log('--- Testing Connection with .env DATABASE_URL ---');
  console.log('URL:', process.env.DATABASE_URL);
  
  const prisma = new PrismaClient();

  try {
    const start = Date.now();
    await prisma.$connect();
    console.log(`✅ Connection successful in ${Date.now() - start}ms`);
    const userCount = await prisma.user.count();
    console.log(`User Count: ${userCount}`);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnvConnection();
