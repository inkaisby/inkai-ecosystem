import { PrismaClient } from '@prisma/client';

/**
 * Singleton global agar Lambda/Vercel memakai satu klien pada instance yang sama.
 * Runtime memakai `DATABASE_URL` (Supabase: transaction pooler `db.<ref>:6543` + ?pgbouncer=true).
 * Migrasi: `npm run migrate:deploy` memakai `DIRECT_URL` di skrip, bukan field schema.
 */
const prismaClientSingleton = (): PrismaClient => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL belum diset');
  }
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
