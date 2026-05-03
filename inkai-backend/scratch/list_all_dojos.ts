import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const dojos = await prisma.dojo.findMany({
      include: { 
        branch: { 
          include: { province: true } 
        } 
      }
    });
    
    console.log(`Total Dojos: ${dojos.length}`);
    dojos.forEach(d => {
      console.log(`- ${d.name} | Branch: ${d.branch.name} | Province: ${d.branch.province.name}`);
    });

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
