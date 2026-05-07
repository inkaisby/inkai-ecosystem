import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const registrations = await prisma.eventRegistration.findMany({
    include: {
      member: true,
      event: true
    }
  });
  console.log(JSON.stringify(registrations, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
