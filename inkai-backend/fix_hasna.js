const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixData() {
  const email = 'hasna@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true }
  });

  if (user) {
    console.log('Fixing hasna@gmail.com...');
    await prisma.user.update({
      where: { email },
      data: {
        roles: {
          disconnect: { name: 'ADMIN_DOJO' }
        }
      }
    });
    console.log('Role ADMIN_DOJO removed from hasna@gmail.com');
  }
  process.exit(0);
}

fixData();
