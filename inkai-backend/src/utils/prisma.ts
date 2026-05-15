import { PrismaClient } from '@prisma/client';

/**
 * Di Vercel, endpoint direct `db.*.supabase.co:5432` sering tidak terjangkau (IPv6).
 * DATABASE_URL harus transaction pooler: host `db.*.supabase.co` port **6543**, user `postgres`, `?pgbouncer=true`.
 */
function rejectSupabaseDirectPortOnVercel(databaseUrl: string): void {
  if (!process.env.VERCEL) return;
  try {
    const u = new URL(databaseUrl);
    const host = u.hostname.toLowerCase();
    if (!host.endsWith('.supabase.co') || !host.startsWith('db.')) return;
    const port = u.port === '' ? '5432' : u.port;
    if (port === '5432') {
      throw new Error(
        '[INKAI] DATABASE_URL memakai direct Postgres Supabase (port 5432). Di Vercel ini biasanya gagal. ' +
          'Ganti ke transaction pooler: port 6543, contoh ' +
          '`postgresql://postgres:***@db.<ref>.supabase.co:6543/postgres?sslmode=require&pgbouncer=true`. ' +
          'Salin dari Supabase → Connect → Transaction. ' +
          'Pastikan env ini di scope Production dan Preview (jika dipakai).',
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('[INKAI]')) {
      throw e;
    }
  }
}

/**
 * Perketat timeout & pooler kecil di edge/serverless supaya handshake ke Supabase tidak putus terlalu cepat.
 */
function normalizeDatabaseUrlForVercel(databaseUrl: string): string {
  if (!process.env.VERCEL) return databaseUrl;
  try {
    const u = new URL(databaseUrl);
    const host = u.hostname.toLowerCase();
    if (!host.endsWith('.supabase.co')) return databaseUrl;
    if (!u.searchParams.has('connect_timeout')) {
      u.searchParams.set('connect_timeout', '30');
    }
    if (!u.searchParams.has('connection_limit')) {
      u.searchParams.set('connection_limit', '1');
    }
    return u.toString();
  } catch {
    return databaseUrl;
  }
}

/**
 * Singleton global agar Lambda/Vercel memakai satu klien pada instance yang sama.
 * Runtime memakai `DATABASE_URL` (Supabase: transaction pooler `db.<ref>:6543` + ?pgbouncer=true).
 * Migrasi: `npm run migrate:deploy` memakai `DIRECT_URL` di skrip, bukan field schema.
 */
const prismaClientSingleton = (): PrismaClient => {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL belum diset');
  }
  rejectSupabaseDirectPortOnVercel(raw);
  const url = normalizeDatabaseUrlForVercel(raw);
  return new PrismaClient({
    datasources: { db: { url } },
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });
};

const g = globalThis as typeof globalThis & { prisma?: PrismaClient };

const prisma = g.prisma ?? prismaClientSingleton();
g.prisma = prisma;

export default prisma;
