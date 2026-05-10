import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();
  const email = 'cabangsby@gmail.com';
  
  const passwordHash = await bcrypt.hash('inkai123', 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  });
  
  console.log('Password reset to inkai123');
  
  await prisma.$disconnect();
}

main();
