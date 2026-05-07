import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  const users = await prisma.user.findMany({
    include: { 
        member: true,
        roles: true
    }
  });
  
  console.log('Available Users:');
  users.forEach(u => {
    console.log(`- Email: ${u.email}, NIA: ${u.member?.nia || 'N/A'}, Name: ${u.member?.fullName || u.fullName || 'N/A'}`);
    if (u.roles.length > 0) {
        console.log(`  Roles: ${u.roles.map(r => r.name).join(', ')}`);
    }
  });
  
  await prisma.$disconnect();
}

main();
