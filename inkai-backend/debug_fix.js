const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  const users = await prisma.user.findMany({
    where: { email: { in: ['hasna@gmail.com', 'gading@gmail.com'] } },
    include: { roles: true }
  });
  console.log('Users:', JSON.stringify(users, null, 2));

  const dojos = await prisma.dojo.findMany({
    where: { name: { contains: 'GADING', mode: 'insensitive' } }
  });
  console.log('Dojos:', JSON.stringify(dojos, null, 2));
  process.exit(0);
}

debug();
