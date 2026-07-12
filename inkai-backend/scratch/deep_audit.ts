import { PrismaClient } from '@prisma/client';

// Helper to normalize phone numbers
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('628')) {
    clean = '08' + clean.slice(3);
  } else if (clean.startsWith('8')) {
    clean = '08' + clean.slice(1);
  }
  return clean;
}

// Helper to normalize NIK/NIA
function normalizeId(id: string | null): string | null {
  if (!id) return null;
  return id.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
}

async function main() {
  const prisma = new PrismaClient();

  console.log('=== RUNNING DEEP AUDIT FOR HIDDEN DUPLICATES ===');

  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    include: { member: true }
  });

  const members = await prisma.member.findMany({
    where: { isDeleted: false }
  });

  console.log(`Auditing ${users.length} active users and ${members.length} active members...\n`);

  // 1. Phone Number Normalization Duplicates
  console.log('--- Checking for Normalized Phone Number Duplicates ---');
  const phoneGroups: Record<string, typeof users> = {};
  users.forEach(u => {
    const norm = normalizePhone(u.phoneNumber);
    if (!norm) return;
    if (!phoneGroups[norm]) phoneGroups[norm] = [];
    phoneGroups[norm].push(u);
  });

  let duplicatePhonesFound = false;
  for (const [phone, list] of Object.entries(phoneGroups)) {
    if (list.length > 1) {
      duplicatePhonesFound = true;
      console.log(`Duplicate phone group [${phone}]:`);
      list.forEach(u => {
        console.log(`  - User ID: ${u.id}, Email: ${u.email}, Raw Phone: ${u.phoneNumber}, Name: ${u.fullName || u.member?.fullName}`);
      });
    }
  }
  if (!duplicatePhonesFound) console.log('No normalized phone duplicates found.');

  // 2. Normalized NIK Duplicates
  console.log('\n--- Checking for Normalized NIK Duplicates ---');
  const nikGroups: Record<string, typeof members> = {};
  members.forEach(m => {
    const norm = normalizeId(m.nik);
    if (!norm) return;
    if (!nikGroups[norm]) nikGroups[norm] = [];
    nikGroups[norm].push(m);
  });

  let duplicateNiksFound = false;
  for (const [nik, list] of Object.entries(nikGroups)) {
    if (list.length > 1) {
      duplicateNiksFound = true;
      console.log(`Duplicate NIK group [${nik}]:`);
      list.forEach(m => {
        console.log(`  - Member ID: ${m.id}, Name: ${m.fullName}, Raw NIK: ${m.nik}, Dojo ID: ${m.dojoId}`);
      });
    }
  }
  if (!duplicateNiksFound) console.log('No normalized NIK duplicates found.');

  // 3. Normalized NIA Duplicates
  console.log('\n--- Checking for Normalized NIA Duplicates ---');
  const niaGroups: Record<string, typeof members> = {};
  members.forEach(m => {
    const norm = normalizeId(m.nia);
    if (!norm) return;
    if (!niaGroups[norm]) niaGroups[norm] = [];
    niaGroups[norm].push(m);
  });

  let duplicateNiasFound = false;
  for (const [nia, list] of Object.entries(niaGroups)) {
    if (list.length > 1) {
      duplicateNiasFound = true;
      console.log(`Duplicate NIA group [${nia}]:`);
      list.forEach(m => {
        console.log(`  - Member ID: ${m.id}, Name: ${m.fullName}, Raw NIA: ${m.nia}, Dojo ID: ${m.dojoId}`);
      });
    }
  }
  if (!duplicateNiasFound) console.log('No normalized NIA duplicates found.');

  // 4. Exact Name Duplicates (Case-Insensitive)
  console.log('\n--- Checking for Duplicate Member Names ---');
  const nameGroups: Record<string, typeof members> = {};
  members.forEach(m => {
    const norm = m.fullName.trim().toLowerCase();
    if (!norm) return;
    if (!nameGroups[norm]) nameGroups[norm] = [];
    nameGroups[norm].push(m);
  });

  let duplicateNamesFound = false;
  for (const [name, list] of Object.entries(nameGroups)) {
    if (list.length > 1) {
      duplicateNamesFound = true;
      console.log(`Duplicate Name group [${name.toUpperCase()}]:`);
      list.forEach(m => {
        console.log(`  - Member ID: ${m.id}, Raw Name: ${m.fullName}, NIK: ${m.nik}, NIA: ${m.nia}, Dojo ID: ${m.dojoId}, Created: ${m.createdAt.toISOString()}`);
      });
    }
  }
  if (!duplicateNamesFound) console.log('No duplicate member names found.');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
});
