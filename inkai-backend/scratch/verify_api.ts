import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const provinceId = 'f987a09c-b07e-474e-b328-5b93ff2bb1b4'; // JAWA TIMUR ID from previous script
  
  try {
    console.log(`Checking branches for Province ID: ${provinceId}`);
    const branches = await prisma.branch.findMany({
      where: { provinceId },
      include: { _count: { select: { dojos: true } } }
    });
    
    console.log('API-like Response Data:', JSON.stringify(branches, null, 2));

    const allProvinces = await prisma.province.findMany();
    console.log('\nAll Provinces in DB:');
    allProvinces.forEach(p => console.log(`- ${p.name} (${p.id})`));

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
