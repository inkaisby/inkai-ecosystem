import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const userId = '0e6f3599-75e1-4c62-8d5e-426e021f227b';
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { member: true, roles: true }
  });
  
  console.log('User:', JSON.stringify(user, null, 2));
  
  await prisma.$disconnect();
}

main();
