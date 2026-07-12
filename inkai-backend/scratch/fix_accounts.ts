import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  console.log('=== Checking if 3612345@inkai.id exists ===');
  const syntheticEmail = '3612345@inkai.id';
  const existingSynthetic = await prisma.user.findUnique({
    where: { email: syntheticEmail }
  });
  console.log('Exists:', !!existingSynthetic);

  // We will perform the updates in a transaction or sequence
  console.log('=== Performing Fixes ===');

  // Fix 1: Antares Alva Edison (currently fulan@gmail.com)
  const antaresUser = await prisma.user.findUnique({
    where: { email: 'fulan@gmail.com' }
  });

  if (antaresUser) {
    console.log(`Updating Antares' email to synthetic email: ${syntheticEmail}`);
    await prisma.user.update({
      where: { id: antaresUser.id },
      data: { email: syntheticEmail }
    });
    console.log('Antares email updated.');
  } else {
    console.log('No user with email fulan@gmail.com found.');
  }

  // Fix 2: wali@gmail.com / wali@gail.com
  // Delete the unused wali@gmail.com without member
  const unusedWali = await prisma.user.findFirst({
    where: {
      email: 'wali@gmail.com',
      member: { is: null }
    }
  });

  if (unusedWali) {
    console.log('Deleting unused wali@gmail.com...');
    // Delete roles associations first if any
    await prisma.user.update({
      where: { id: unusedWali.id },
      data: { roles: { disconnect: [] } }
    });
    await prisma.user.delete({
      where: { id: unusedWali.id }
    });
    console.log('Unused wali@gmail.com deleted.');
  }

  // Update wali@gail.com to wali@gmail.com
  const typoWali = await prisma.user.findFirst({
    where: { email: 'wali@gail.com' }
  });

  if (typoWali) {
    console.log('Updating typo email wali@gail.com to wali@gmail.com...');
    await prisma.user.update({
      where: { id: typoWali.id },
      data: { email: 'wali@gmail.com' }
    });
    console.log('Wali email corrected.');
  }

  await prisma.$disconnect();
  console.log('=== All Fixes Completed ===');
}

main().catch(err => {
  console.error(err);
});
