import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Hardcoded for one-time fix
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:BThMKtEinCGIqcCBs@db.mzmdhkwleufeiyaspmns.supabase.co:5432/postgres"
    }
  }
});

async function main() {
  console.log('Starting one-shot seed...');
  const passwordHash = await bcrypt.hash('h413ib', 12);

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  await prisma.role.upsert({
    where: { name: 'MEMBER' },
    update: {},
    create: { name: 'MEMBER' },
  });

  await prisma.user.upsert({
    where: { email: 'inkaisby@gmail.com' },
    update: {},
    create: {
      email: 'inkaisby@gmail.com',
      passwordHash,
      roles: { connect: { id: adminRole.id } },
    },
  });

  console.log('Admin account created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
