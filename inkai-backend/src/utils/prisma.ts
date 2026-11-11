import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

export type Tenant = 'surabaya' | 'majestigers';

interface TenantStore {
  tenant: Tenant;
}

const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getTenantContext(): Tenant {
  return tenantStorage.getStore()?.tenant || 'surabaya';
}

export function setTenantContext(tenant: Tenant) {
  tenantStorage.enterWith({ tenant });
}

export function runWithTenant<T>(tenant: Tenant, fn: () => T): T {
  return tenantStorage.run({ tenant }, fn);
}

/** Hilangkan spasi / newline dari paste Vercel & tanda kutip luar ("...") yang ikut ke nilai env. */
export function sanitizeDatabaseUrlFromEnv(raw: string | undefined): string {
  let s = (raw ?? '').trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function isSupabaseRelatedHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h.endsWith('.supabase.co') || h.includes('.pooler.supabase.com')
  );
}

/**
 * Di Vercel, endpoint direct `db.*.supabase.co:5432` sering tidak terjangkau (IPv6).
 * Transaction pooler umum: host `db.*.supabase.co` port **6543**, user `postgres`, `?pgbouncer=true`.
 * Session/shared pooler IPv4: host `aws-*-….pooler.supabase.com` port **5432**, user **`postgres.<ref>`**.
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
 * Normalisasi URL database:
 * - Di Vercel: gunakan connection pooler (:6543) dengan timeout dan connection limit ketat.
 * - Di Localhost/Dev: jika port 6543 (yang sering diblokir firewall/ISP lokal), dialihkan ke port 5432.
 */
function normalizeDatabaseUrlForEnvironment(databaseUrl: string): string {
  try {
    const u = new URL(databaseUrl);
    const host = u.hostname.toLowerCase();
    if (!isSupabaseRelatedHost(host)) return databaseUrl;

    if (process.env.VERCEL) {
      if (!u.searchParams.has('connect_timeout')) {
        u.searchParams.set('connect_timeout', '30');
      }
      if (!u.searchParams.has('connection_limit')) {
        u.searchParams.set('connection_limit', '1');
      }
      return u.toString();
    }

    // Local dev fallback ke port 5432 jika menggunakan shared pooler :6543
    if (u.port === '6543') {
      u.port = '5432';
      u.searchParams.delete('pgbouncer');
      return u.toString();
    }

    return u.toString();
  } catch {
    return databaseUrl;
  }
}

function createPrismaClient(raw: string, tenantName: string): PrismaClient {
  const sanitized = sanitizeDatabaseUrlFromEnv(raw);
  if (!sanitized) {
    throw new Error(`DATABASE_URL untuk ${tenantName} belum diset`);
  }
  rejectSupabaseDirectPortOnVercel(sanitized);
  const url = normalizeDatabaseUrlForEnvironment(sanitized);
  return new PrismaClient({
    datasources: { db: { url } },
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });
}

const g = globalThis as typeof globalThis & {
  prismaClients?: Partial<Record<Tenant, PrismaClient>>;
  prisma?: PrismaClient;
};

if (!g.prismaClients) {
  g.prismaClients = {};
}

export function getPrismaClient(tenant: Tenant = getTenantContext()): PrismaClient {
  const resolvedTenant: Tenant = tenant === 'majestigers' ? 'majestigers' : 'surabaya';

  if (g.prismaClients![resolvedTenant]) {
    return g.prismaClients![resolvedTenant]!;
  }

  let dbUrl = '';
  if (resolvedTenant === 'majestigers') {
    dbUrl =
      process.env.DATABASE_URL_MAJESTIGERS ||
      (process.env.DATABASE_URL?.includes('dlkiwinvpihdcdvmaqlr')
        ? process.env.DATABASE_URL
        : '');
  } else {
    dbUrl =
      process.env.DATABASE_URL_SURABAYA ||
      (process.env.DATABASE_URL?.includes('ztrryuhhdoqdglajukuw')
        ? process.env.DATABASE_URL
        : '') ||
      process.env.DATABASE_URL ||
      '';
  }

  if (!dbUrl) {
    dbUrl = process.env.DATABASE_URL || '';
  }

  const client = createPrismaClient(dbUrl, resolvedTenant);
  g.prismaClients![resolvedTenant] = client;
  return client;
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const val = Reflect.get(client, prop, client);
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

export default prisma;
