import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  const memberId = 'bb4bc17e-cac8-4afa-a3bb-48b2f9f9668c';

  // Get member registrations
  const registrations = await prisma.eventRegistration.findMany({
    where: { memberId },
    include: {
      event: true,
      category: true
    }
  });

  console.log('Member Registrations:', JSON.stringify(registrations, null, 2));

  // Get member billings
  const billings = await prisma.billing.findMany({
    where: { memberId },
    include: {
      payment: true
    }
  });

  console.log('Member Billings:', JSON.stringify(billings, null, 2));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
});
