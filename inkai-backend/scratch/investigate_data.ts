import { PrismaClient } from '@prisma/client';

async function checkLocal() {
  console.log('--- Checking Local Database (SQLite) ---');
  // NOTE: This assumes the provider was sqlite when dev.db was populated.
  // If the current @prisma/client is generated for postgres, this might fail
  // if it tries to use postgres features on sqlite.
  const prismaLocal = new PrismaClient({
    datasources: {
      db: {
        url: "file:./prisma/dev.db"
      }
    }
  });

  try {
    const provinceCount = await prismaLocal.province.count();
    const branchCount = await prismaLocal.branch.count();
    const dojoCount = await prismaLocal.dojo.count();
    const memberCount = await prismaLocal.member.count();
    
    console.log(`Local Provinces: ${provinceCount}`);
    console.log(`Local Branches: ${branchCount}`);
    console.log(`Local Dojos: ${dojoCount}`);
    console.log(`Local Members: ${memberCount}`);
    
    if (dojoCount > 0) {
      const dojos = await prismaLocal.dojo.findMany({ 
        take: 5,
        include: { branch: true }
      });
      console.log('Sample Local Dojos:', dojos.map(d => `${d.name} (${d.branch.name})`));
    }
  } catch (error: any) {
    console.error('Error checking local DB:', error.message);
  } finally {
    await prismaLocal.$disconnect();
  }
}

async function checkCurrentEnv() {
  console.log('\n--- Checking Current .env Database ---');
  const prisma = new PrismaClient();
  try {
    const provinceCount = await prisma.province.count();
    const branchCount = await prisma.branch.count();
    const dojoCount = await prisma.dojo.count();
    
    console.log(`Current Provinces: ${provinceCount}`);
    console.log(`Current Branches: ${branchCount}`);
    console.log(`Current Dojos: ${dojoCount}`);

    if (dojoCount > 0) {
      const dojos = await prisma.dojo.findMany({ 
        take: 5,
        include: { branch: true }
      });
      console.log('Sample Current Dojos:', dojos.map(d => `${d.name} (${d.branch.name})`));
    }
  } catch (error: any) {
    console.error('Error checking current DB:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await checkLocal();
  await checkCurrentEnv();
}

main();
