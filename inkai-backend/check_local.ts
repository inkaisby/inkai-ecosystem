import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('--- Checking Local Database (SQLite) ---');
    const userCount = await prisma.user.count();
    const provinceCount = await prisma.province.count();
    const dojoCount = await prisma.dojo.count();
    const memberCount = await prisma.member.count();

    console.log(`Users: ${userCount}`);
    console.log(`Provinces: ${provinceCount}`);
    console.log(`Dojos: ${dojoCount}`);
    console.log(`Members: ${memberCount}`);

    const latestUsers = await prisma.user.findMany({
      take: 5,
      select: { email: true, createdAt: true }
    });
    console.log('\nLatest 5 Users:');
    console.table(latestUsers);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
