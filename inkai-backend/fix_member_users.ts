import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const members = await prisma.member.findMany({
    where: {
      nia: { not: null },
      userId: null
    }
  });

  console.log(`Found ${members.length} members without User accounts.`);

  const hashedPassword = await bcrypt.hash('123456', 12);

  let success = 0;
  let failed = 0;

  for (const member of members) {
    try {
      const email = `${member.nia?.replace(/\./g, '')}@inkai.id`; // Remove dots for email
      
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            fullName: member.fullName,
            roles: {
              connectOrCreate: {
                where: { name: 'MEMBER' },
                create: { name: 'MEMBER' }
              }
            }
          }
        });

        await tx.member.update({
          where: { id: member.id },
          data: { userId: user.id }
        });
      });
      success++;
      if (success % 50 === 0) console.log(`Progress: ${success} users created...`);
    } catch (error: any) {
      console.error(`Failed for member ${member.fullName} (${member.nia}): ${error.message}`);
      failed++;
    }
  }

  console.log(`\n--- FINISHED ---`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
