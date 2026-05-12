import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Converting all Member and User data to UPPERCASE...');

  // 1. Update all Members
  const members = await prisma.member.findMany();
  for (const m of members) {
    await prisma.member.update({
      where: { id: m.id },
      data: {
        fullName: m.fullName.toUpperCase(),
        birthPlace: m.birthPlace ? m.birthPlace.toUpperCase() : null,
        address: m.address ? m.address.toUpperCase() : null,
        currentRank: m.currentRank.toUpperCase()
      }
    });
  }
  console.log(`Updated ${members.length} members.`);

  // 2. Update all Users
  const users = await prisma.user.findMany();
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        fullName: u.fullName ? u.fullName.toUpperCase() : null
      }
    });
  }
  console.log(`Updated ${users.length} users.`);

  console.log('All data is now UPPERCASE.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
