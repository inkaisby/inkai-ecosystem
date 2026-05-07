import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  const khawla = await prisma.user.findFirst({
    where: { email: 'rahmanh946@gmail.com' },
    include: {
      member: {
        include: {
          dojo: true
        }
      }
    }
  });
  
  if (khawla && khawla.member) {
    console.log(`User: ${khawla.member.fullName}`);
    console.log(`Dojo: ${khawla.member.dojo?.name || 'N/A'}`);
  } else {
    console.log('Khawla member not found');
  }
  
  await prisma.$disconnect();
}

main();
