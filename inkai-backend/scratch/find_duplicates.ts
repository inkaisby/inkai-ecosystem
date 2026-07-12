import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  console.log('=== Checking phone number 081256 ===');
  const phoneUsers = await prisma.user.findMany({
    where: { phoneNumber: '081256' },
    include: { member: true }
  });
  console.log('Users with phone 081256:', JSON.stringify(phoneUsers, null, 2));

  console.log('=== Checking if there are other users with fulan or placeholder emails ===');
  const fulanUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: 'fulan',
        mode: 'insensitive'
      }
    },
    include: { member: true }
  });
  console.log('Fulan Users:', JSON.stringify(fulanUsers, null, 2));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
});
