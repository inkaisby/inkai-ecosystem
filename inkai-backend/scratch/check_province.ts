import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  const dojo = await prisma.dojo.findFirst({
    where: { name: 'GADING' },
    include: { branch: { include: { province: true } } }
  });
  
  if (dojo) {
    console.log(`Dojo: ${dojo.name}`);
    console.log(`Branch: ${dojo.branch?.name}`);
    console.log(`Province: ${dojo.branch?.province?.name}`);
  } else {
    console.log('Dojo GADING not found');
  }
  
  await prisma.$disconnect();
}

main();
