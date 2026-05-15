import { PrismaClient } from '@prisma/client';

/**
 * Singleton global agar Lambda/Vercel memakai satu klien pada instance yang sama
 * dan tidak membuka banyak koneksi ke Postgres.
 *
 * Produksi: isi DATABASE_URL dengan URL pooler Supabase / PgBouncer.
 * Untuk `prisma migrate`, gunakan connection string langsung (port 5432) jika pooler tidak didukung.
 */
const prismaClientSingleton = (): PrismaClient => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL belum diset');
  }
  /** Paksa URL runtime = DATABASE_URL (pooler). Jangan sampai klien memakai DIRECT_URL — di Vercel direct sering tidak terjangkau (IPv6). */
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
