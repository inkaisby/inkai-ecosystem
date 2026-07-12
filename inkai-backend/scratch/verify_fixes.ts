import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  console.log('=== VERIFYING DATABASE FIXES ===');

  const fulanUser = await prisma.user.findFirst({
    where: { email: 'fulan@gmail.com' }
  });
  console.log('User with email fulan@gmail.com (should be null):', fulanUser);

  const antaresUser = await prisma.user.findFirst({
    where: { email: '3612345@inkai.id' },
    include: { member: true }
  });
  console.log('User with email 3612345@inkai.id (Antares):', antaresUser ? { email: antaresUser.email, name: antaresUser.fullName, memberName: antaresUser.member?.fullName } : null);

  const waliGail = await prisma.user.findFirst({
    where: { email: 'wali@gail.com' }
  });
  console.log('User with email wali@gail.com (should be null):', waliGail);

  const waliGmail = await prisma.user.findMany({
    where: { email: 'wali@gmail.com' },
    include: { member: true }
  });
  console.log('Users with email wali@gmail.com (should be 1 active user):');
  waliGmail.forEach(w => {
    console.log(`- Email: ${w.email}, Name: ${w.fullName}, Member: ${w.member?.fullName}`);
  });

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
});
