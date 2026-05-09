const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const email = 'hasna@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true }
  });
  console.log('User:', user);
  process.exit(0);
}

checkUser();
