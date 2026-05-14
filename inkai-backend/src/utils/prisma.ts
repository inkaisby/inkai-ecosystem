import { PrismaClient } from '@prisma/client';

/**
 * Singleton global agar Lambda/Vercel memakai satu klien pada instance yang sama
 * dan tidak membuka banyak koneksi ke Postgres.
 *
 * Produksi: isi DATABASE_URL dengan URL pooler Supabase / PgBouncer.
 * Untuk `prisma migrate`, gunakan connection string langsung (port 5432) jika pooler tidak didukung.
 */
const prismaClientSingleton = (): PrismaClient =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

const g = globalThis as typeof globalThis & { prisma?: PrismaClient };

const prisma = g.prisma ?? prismaClientSingleton();
g.prisma = prisma;

export default prisma;
