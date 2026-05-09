import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({
    include: {
      roles: true
    }
  });
  users.forEach(u => {
    console.log(`User: ${u.email} | Roles: ${u.roles.map(r => r.name).join(', ')}`);
  });

  console.log('\n--- ROLES ---');
  const roles = await prisma.role.findMany();
  roles.forEach(r => {
    console.log(`Role: ${r.name}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
