import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    const provinces = await prisma.province.findMany({
      where: { name: { contains: 'JAWA TIMUR', mode: 'insensitive' } },
      include: { _count: { select: { branches: true } } }
    });
    console.log('--- JAWA TIMUR PROVINCES ---');
    console.log(JSON.stringify(provinces, null, 2));

    const branches = await prisma.branch.findMany({
      where: { name: 'SURABAYA' },
      include: { province: true, _count: { select: { dojos: true } } }
    });
    console.log('\n--- SURABAYA BRANCHES ---');
    console.log(JSON.stringify(branches, null, 2));

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
