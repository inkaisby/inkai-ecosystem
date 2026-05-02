import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('h413ib', 12);

  // 1. Roles
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

  await prisma.role.upsert({
    where: { name: 'PARENT' },
    update: {},
    create: { name: 'PARENT' },
  });

  // 2. Admin User
  await prisma.user.upsert({
    where: { email: 'inkaisby@gmail.com' },
    update: {},
    create: {
      email: 'inkaisby@gmail.com',
      passwordHash,
      roles: { connect: { id: adminRole.id } },
    },
  });

  // 3. Provinces
  const provinces = [
    'DKI JAKARTA', 'JAWA BARAT', 'JAWA TENGAH', 'JAWA TIMUR', 'BANTEN', 'BALI',
    'SUMATERA UTARA', 'SUMATERA BARAT', 'RIAU', 'KEPULAUAN RIAU', 'JAMBI',
    'SUMATERA SELATAN', 'BANGKA BELITUNG', 'BENGKULU', 'LAMPUNG',
    'KALIMANTAN BARAT', 'KALIMANTAN TENGAH', 'KALIMANTAN SELATAN', 'KALIMANTAN TIMUR', 'KALIMANTAN UTARA',
    'SULAWESI UTARA', 'SULAWESI TENGAH', 'SULAWESI SELATAN', 'SULAWESI TENGGARA', 'GORONTALO', 'SULAWESI BARAT',
    'NUSA TENGGARA BARAT', 'NUSA TENGGARA TIMUR', 'MALUKU', 'MALUKU UTARA',
    'PAPUA', 'PAPUA BARAT', 'PAPUA SELATAN', 'PAPUA TENGAH', 'PAPUA PEGUNUNGAN', 'PAPUA BARAT DAYA'
  ];

  console.log('Seeding Provinces...');
  for (const name of provinces) {
    await prisma.province.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 4. Sample Branches & Dojos
  const jakarta = await prisma.province.findUnique({ where: { name: 'DKI JAKARTA' } });
  if (jakarta) {
    const branch = await prisma.branch.upsert({
      where: { name_provinceId: { name: 'JAKARTA PUSAT', provinceId: jakarta.id } },
      update: {},
      create: { name: 'JAKARTA PUSAT', provinceId: jakarta.id }
    });
    await prisma.dojo.upsert({
      where: { name_branchId: { name: 'DOJO PUSAT MANGGALA', branchId: branch.id } },
      update: {},
      create: { name: 'DOJO PUSAT MANGGALA', branchId: branch.id, address: 'Senayan' }
    });
  }

  const jatim = await prisma.province.findUnique({ where: { name: 'JAWA TIMUR' } });
  if (jatim) {
    const branch = await prisma.branch.upsert({
      where: { name_provinceId: { name: 'SURABAYA', provinceId: jatim.id } },
      update: {},
      create: { name: 'SURABAYA', provinceId: jatim.id }
    });
    await prisma.dojo.upsert({
      where: { name_branchId: { name: 'DOJO KONI JATIM', branchId: branch.id } },
      update: {},
      create: { name: 'DOJO KONI JATIM', branchId: branch.id, address: 'Surabaya' }
    });
  }

  const jabar = await prisma.province.findUnique({ where: { name: 'JAWA BARAT' } });
  if (jabar) {
    const branch = await prisma.branch.upsert({
      where: { name_provinceId: { name: 'BANDUNG', provinceId: jabar.id } },
      update: {},
      create: { name: 'BANDUNG', provinceId: jabar.id }
    });
    await prisma.dojo.upsert({
      where: { name_branchId: { name: 'DOJO GOR SAPARUA', branchId: branch.id } },
      update: {},
      create: { name: 'DOJO GOR SAPARUA', branchId: branch.id, address: 'Bandung' }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
