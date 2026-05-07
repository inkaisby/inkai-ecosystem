import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.eventCategory.findMany({
    where: { eventId: 'a757fd08-9318-41a3-a7f8-8b3500db21e8' }
  });
  console.log(JSON.stringify(categories, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
