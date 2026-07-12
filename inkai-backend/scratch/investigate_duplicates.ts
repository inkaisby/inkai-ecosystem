import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  console.log('=== CHECKING OTHER SYMBOLS ===');
  
  // Check if any member has NIA '23.27827'
  const niaMember = await prisma.member.findFirst({
    where: { nia: '23.27827' }
  });
  console.log("Member with NIA '23.27827':", niaMember);

  // Check if Dojo names
  const dojo1 = await prisma.dojo.findUnique({ where: { id: '1f44c8c3-8985-4b85-91d2-17b2835369d8' } });
  const dojo2 = await prisma.dojo.findUnique({ where: { id: '562c29e0-4c37-4827-bcaf-fec896d99bad' } });
  const dojo3 = await prisma.dojo.findUnique({ where: { id: '98566d26-c8d8-4578-9cdc-5c8bb08273fb' } });

  console.log(`Dojo 1: ${dojo1?.name}`);
  console.log(`Dojo 2: ${dojo2?.name}`);
  console.log(`Dojo 3: ${dojo3?.name}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
});
