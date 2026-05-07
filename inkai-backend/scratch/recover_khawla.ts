import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const memberId = 'd0c4ef7b-3ae2-43aa-9d3f-5477467cfc03';
  const eventId = 'a757fd08-9318-41a3-a7f8-8b3500db21e8';
  const categoryId = 'f1a97c38-ee4f-43ff-bd92-7adf66751cea';
  const billingId = '39ee0b58-4fd6-4b24-922d-c7ecbdea8937';

  console.log('Starting recovery for KHAWLA...');

  const registration = await prisma.eventRegistration.create({
    data: {
      memberId,
      eventId,
      categoryId,
      status: 'PAID'
    }
  });

  console.log('Created registration:', registration.id);

  await prisma.billing.update({
    where: { id: billingId },
    data: { registrationId: registration.id }
  });

  console.log('Updated billing to link registration.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
