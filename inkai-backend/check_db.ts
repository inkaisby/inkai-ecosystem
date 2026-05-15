/// <reference types="node" />

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/** Ringkas URL untuk log — tanpa password. */
function describeDatabaseUrl(raw: string | undefined): string {
  if (!raw?.trim()) return '(DATABASE_URL kosong)';
  try {
    const u = new URL(raw);
    const hints: string[] = [];
    const port = u.port || '(default)';
    hints.push(`host=${u.hostname}`);
    hints.push(`port=${port}`);
    if (raw.startsWith('file:')) return `SQLite file URL (panjang ${raw.length} char)`;
    if (u.searchParams.has('pgbouncer'))
      hints.push(`pgbouncer=${u.searchParams.get('pgbouncer')}`);
    if (u.searchParams.has('sslmode'))
      hints.push(`sslmode=${u.searchParams.get('sslmode')}`);
    return hints.join(' ');
  } catch {
    return '(DATABASE_URL tidak valid sebagai URL)';
  }
}

async function main() {
  const raw = process.env.DATABASE_URL;
  console.log('--- INKAI DB smoke test ---');
  console.log(describeDatabaseUrl(raw));
  console.log(`VERCEL=${process.env.VERCEL ?? '(empty)'}`);
  console.log(`NODE_ENV=${process.env.NODE_ENV ?? '(empty)'}`);

  if (!raw?.trim()) {
    console.error('DATABASE_URL tidak diset. Isi di .env lokal atau Vercel → Environment Variables.');
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: raw } },
    log: ['error'],
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    const n = await prisma.user.count();
    console.log(`OK — koneksi DB jalan. Jumlah user (tabel user): ${n}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('GAGAL:', msg);
    if (/Can't reach database server/i.test(msg)) {
      console.error(`
Kemungkinan:
• Project Supabase yang host-nya Anda pakai dalam keadaan pause (cek kartu project di dashboard).
• Reference ID salah: host harus sesuai project yang benar (Settings → General).
• Salah salin Transaction pooler di Supabase Connect (port 6543, user postgres, ?pgbouncer=true).
• Deploy Vercel belum pakai env terbaru — redeploy Production setelah ubah DATABASE_URL.
`);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
