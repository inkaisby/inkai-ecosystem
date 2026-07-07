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

  console.log('Seeding Navigation Tabs...');
  const defaultTabs = [
    {
      name: 'Home',
      slug: 'home',
      content: JSON.stringify({
        heroTitle: "Selamat Datang di INKAI",
        subtitle: "Institut Karate-Do Indonesia",
        teksSambutan: "Institut Karate-Do Indonesia (INKAI) adalah salah satu perguruan karate tertua dan terbesar di Indonesia. Website ini merupakan portal resmi publik dan keanggotaan.\n\nWebsite ini dirancang untuk memudahkan manajemen dojo, anggota, iuran, ujian, absensi, serta agenda kegiatan penting perguruan."
      }),
      order: 0,
    },
    {
      name: 'Sejarah',
      slug: 'sejarah',
      content: JSON.stringify({
        timeline: [
          { tahun: "1971", judul: "Pendirian INKAI", deskripsi: "Didirikan pada tanggal 15 April 1971 oleh para tokoh karate senior di Indonesia." },
          { tahun: "1980-an", judul: "Ekspansi Nasional", deskripsi: "INKAI mulai dibina secara massal ke jajaran militer dan sekolah-sekolah di seluruh provinsi." },
          { tahun: "2025", judul: "Juara Umum Piala Panglima TNI", deskripsi: "Meraih prestasi gemilang sebagai juara umum kejuaraan nasional bergengsi." }
        ]
      }),
      order: 1,
    },
    {
      name: 'Makna Lambang',
      slug: 'makna-lambang',
      content: JSON.stringify({
        simbolMakna: [
          { simbol: "Bulatan Merah (Hinomaru)", makna: "Melambangkan keberanian yang suci, kebenaran, serta tekad yang tak tergoyahkan." },
          { simbol: "Karateka yang Berlutut", makna: "Melambangkan kesetiaan, kerendahan hati, rasa hormat (rei), serta kedisiplinan yang tinggi." },
          { simbol: "Tulisan INKAI", makna: "Merupakan identitas resmi Institut Karate-Do Indonesia sebagai pemersatu secara nasional." }
        ]
      }),
      order: 2,
    },
    {
      name: 'Struktur Organisasi',
      slug: 'struktur-organisasi',
      content: JSON.stringify({
        struktur: [
          {
            level: "Dewan Guru",
            anggota: [
              { nama: "Shihan H. Syahril", jabatan: "Ketua Dewan Guru", foto: "" },
              { nama: "Shihan Agus", jabatan: "Anggota Dewan Guru", foto: "" },
              { nama: "Shihan Bambang", jabatan: "Anggota Dewan Guru", foto: "" }
            ]
          },
          {
            level: "Pengurus Pusat (PP)",
            anggota: [
              { nama: "Laksdya TNI Shihan Ivan", jabatan: "Ketua Umum", foto: "" },
              { nama: "Sensei Dedi", jabatan: "Sekretaris Umum", foto: "" },
              { nama: "Sensei Rika", jabatan: "Bendahara Umum", foto: "" },
              { nama: "Sensei Hendra", jabatan: "Kabid Pembinaan Prestasi", foto: "" }
            ]
          }
        ]
      }),
      order: 3,
    },
    {
      name: 'Visi & Misi',
      slug: 'visi-misi',
      content: JSON.stringify({
        visi: "Menjadikan INKAI sebagai perguruan karate-do terdepan di Indonesia yang unggul, berkarakter, berprestasi dunia, dan solid secara organisasi.",
        misi: [
          "Membina fisik dan mental karateka berlandaskan nilai luhur budi pekerti.",
          "Melaksanakan tata kelola organisasi modern secara transparan, akuntabel, dan profesional.",
          "Melahirkan atlet-atlet berprestasi internasional secara berkelanjutan."
        ]
      }),
      order: 4,
    },
  ];

  for (const t of defaultTabs) {
    await prisma.navTab.upsert({
      where: { slug: t.slug },
      update: { name: t.name, content: t.content, order: t.order },
      create: t,
    });
  }

  console.log('Seeding News Carousel...');
  const defaultCarousel = [
    {
      title: 'Kejurnas INKAI 2026 Segera Digelar di Jakarta',
      imageUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800',
      targetUrl: '/events',
      order: 0,
    },
    {
      title: 'Gashuku Nasional Bali: Persiapan Ujian DAN Akbar',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800',
      targetUrl: '/events',
      order: 1,
    },
  ];

  for (const c of defaultCarousel) {
    const existing = await prisma.newsCarousel.findFirst({ where: { title: c.title } });
    if (!existing) {
      await prisma.newsCarousel.create({ data: c });
    }
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
