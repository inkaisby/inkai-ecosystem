import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const prisma = new PrismaClient();

const MONTHS_MAP: { [key: string]: number } = {
  'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
  'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
};

async function parseDate(dateStr: string): Promise<Date | null> {
  if (!dateStr) return null;
  
  // Format: "Surabaya, 28 Februari 2011"
  const parts = dateStr.split(',');
  const datePart = parts.length > 1 ? parts[1].trim() : parts[0].trim();
  
  const dateParts = datePart.split(' ');
  if (dateParts.length !== 3) return null;
  
  const day = parseInt(dateParts[0]);
  const monthName = dateParts[1].toLowerCase();
  const year = parseInt(dateParts[2]);
  
  const month = MONTHS_MAP[monthName];
  if (month === undefined || isNaN(day) || isNaN(year)) return null;
  
  return new Date(year, month, day);
}

function parsePlace(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split(',');
  return parts.length > 1 ? parts[0].trim() : null;
}

async function main() {
  const csvFilePath = path.join(__dirname, 'members_import.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('File members_import.csv tidak ditemukan di folder root backend.');
    console.log('Silakan ekspor data Excel Anda ke CSV dan simpan sebagai members_import.csv');
    process.exit(1);
  }

  const fileStream = fs.createReadStream(csvFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let rowCount = 0;
  let successCount = 0;
  let skipCount = 0;

  console.log('Memulai proses impor...');

  for await (const line of rl) {
    rowCount++;
    // Skip header row if it contains "NO." or "NAMA"
    if (rowCount === 1 && (line.includes('NO.') || line.includes('NAMA'))) {
      continue;
    }

    // Simple CSV parser (handles quotes)
    const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
    
    if (columns.length < 8) {
      console.log(`Baris ${rowCount}: Data tidak lengkap, dilewati.`);
      skipCount++;
      continue;
    }

    const [nia, fullName, birthInfo, genderCode, address, kyuLama, kyuBaru, sabuk, ranting] = columns;

    try {
      // 1. Cek NIA jika ada
      if (nia) {
        const existing = await prisma.member.findUnique({ where: { nia } });
        if (existing) {
          console.log(`Baris ${rowCount}: NIA ${nia} sudah terdaftar (${fullName}), dilewati.`);
          skipCount++;
          continue;
        }
      }

      // 2. Cari Dojo
      let dojo = await prisma.dojo.findFirst({
        where: { name: { contains: ranting, mode: 'insensitive' } }
      });

      if (!dojo) {
        console.log(`Baris ${rowCount}: Dojo "${ranting}" tidak ditemukan, mencari dojo default...`);
        dojo = await prisma.dojo.findFirst(); // Fallback ke dojo pertama
      }

      if (!dojo) {
        console.error(`Baris ${rowCount}: Tidak ada Dojo sama sekali di database!`);
        skipCount++;
        continue;
      }

      // 3. Transform Data
      const birthDate = await parseDate(birthInfo);
      const birthPlace = parsePlace(birthInfo);
      const gender = genderCode.toUpperCase() === 'P' ? 'Perempuan' : (genderCode.toUpperCase() === 'L' ? 'Laki-laki' : null);
      const currentRank = `${sabuk} (KYU ${kyuBaru})`;

      // 4. Insert
      await prisma.member.create({
        data: {
          nia: nia || null,
          fullName,
          birthPlace,
          birthDate,
          gender,
          address,
          currentRank,
          dojoId: dojo.id,
          status: 'Active'
        }
      });

      console.log(`Baris ${rowCount}: Berhasil mengimpor ${fullName}`);
      successCount++;
    } catch (error: any) {
      console.error(`Baris ${rowCount}: Gagal mengimpor ${fullName}. Error: ${error.message}`);
      skipCount++;
    }
  }

  console.log('\n--- HASIL IMPOR ---');
  console.log(`Total baris diproses: ${rowCount}`);
  console.log(`Berhasil: ${successCount}`);
  console.log(`Dilewati/Gagal: ${skipCount}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
