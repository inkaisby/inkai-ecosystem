import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  const khawla = await prisma.user.findFirst({
    where: { email: 'rahmanh946@gmail.com' },
    include: {
      member: {
        include: {
          eventRegistrations: { include: { event: true } },
          ranks: true
        }
      }
    }
  });
  
  if (khawla && khawla.member) {
    console.log(`User: ${khawla.member.fullName}`);
    console.log(`Registrations: ${khawla.member.eventRegistrations.length}`);
    khawla.member.eventRegistrations.forEach(r => {
      console.log(`- Event: ${r.event.title}, Status: ${r.status}`);
    });
    console.log(`Ranks: ${khawla.member.ranks.length}`);
  } else {
    console.log('Khawla member not found');
  }
  
  await prisma.$disconnect();
}

main();
