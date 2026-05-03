import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('h413ib', 12);

  console.log('Seeding roles and permissions...');

  // 1. Roles
  const roles = [
    { name: 'ADMINISTRATOR' },
    { name: 'ADMIN_PUSAT' },
    { name: 'ADMIN_PROVINCE' },
    { name: 'ADMIN_BRANCH' },
    { name: 'MEMBER' },
    { name: 'PARENT' },
  ];

  const roleMap: Record<string, any> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    roleMap[r.name] = role;
  }

  // 2. Permissions
  const permissions = [
    { name: 'Dashboard', slug: 'dashboard' },
    { name: 'Anggota', slug: 'members' },
    { name: 'Organisasi', slug: 'organization' },
    { name: 'Verifikasi', slug: 'verification' },
    { name: 'Event', slug: 'events' },
    { name: 'Store', slug: 'store' },
    { name: 'Library', slug: 'library' },
    { name: 'Broadcast', slug: 'broadcast' },
    { name: 'Settings', slug: 'settings' },
  ];

  const permMap: Record<string, any> = {};
  for (const p of permissions) {
    const perm = await prisma.permission.upsert({
      where: { slug: p.slug },
      update: { name: p.name },
      create: p,
    });
    permMap[p.slug] = perm;
  }

  // 3. Assign Permissions to Roles
  // ADMINISTRATOR gets everything
  for (const p of Object.values(permMap)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['ADMINISTRATOR'].id, permissionId: p.id } },
      update: {},
      create: { roleId: roleMap['ADMINISTRATOR'].id, permissionId: p.id },
    });
  }

  // ADMIN_PUSAT gets most things
  const pusatPerms = ['dashboard', 'members', 'organization', 'verification', 'events', 'broadcast'];
  for (const slug of pusatPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['ADMIN_PUSAT'].id, permissionId: permMap[slug].id } },
      update: {},
      create: { roleId: roleMap['ADMIN_PUSAT'].id, permissionId: permMap[slug].id },
    });
  }

  // ADMIN_PROVINCE and ADMIN_BRANCH get basic access
  const basePerms = ['dashboard', 'members', 'organization', 'events'];
  for (const roleName of ['ADMIN_PROVINCE', 'ADMIN_BRANCH']) {
    for (const slug of basePerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleMap[roleName].id, permissionId: permMap[slug].id } },
        update: {},
        create: { roleId: roleMap[roleName].id, permissionId: permMap[slug].id },
      });
    }
  }

  // 4. Admin User (inkaisby@gmail.com)
  await prisma.user.upsert({
    where: { email: 'inkaisby@gmail.com' },
    update: {
      roles: {
        connect: { id: roleMap['ADMINISTRATOR'].id }
      }
    },
    create: {
      email: 'inkaisby@gmail.com',
      passwordHash,
      roles: {
        connect: { id: roleMap['ADMINISTRATOR'].id }
      },
    },
  });

  // 5. Provinces (Basic Seed)
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
