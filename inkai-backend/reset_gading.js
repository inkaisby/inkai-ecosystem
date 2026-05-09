const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetGading() {
  const email = 'gading@gmail.com';
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });
    console.log(`Password for ${email} has been reset to: ${password}`);
  } else {
    console.log(`User ${email} not found!`);
  }
  process.exit(0);
}

resetGading();
