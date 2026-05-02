import { PrismaClient } from '@prisma/client';

async function checkLocal() {
  console.log('--- Checking Local Database (SQLite) ---');
  const prismaLocal = new PrismaClient({
    datasources: {
      db: {
        url: "file:./prisma/dev.db"
      }
    }
  });

  try {
    const userCount = await prismaLocal.user.count();
    const provinceCount = await prismaLocal.province.count();
    console.log(`Local User Count: ${userCount}`);
    console.log(`Local Province Count: ${provinceCount}`);
    
    const users = await prismaLocal.user.findMany({ take: 3 });
    console.log('Local Users:', users.map(u => u.email));
  } catch (error) {
    console.error('Error checking local DB:', error);
  } finally {
    await prismaLocal.$disconnect();
  }
}

async function checkSupabase() {
  console.log('\n--- Checking Supabase Database (PostgreSQL) ---');
  const supabaseUrl = "postgresql://postgres:BThMKtEinCGIqcCBs@db.mzmdhkwleufeiyaspmns.supabase.co:5432/postgres";
  const prismaSupabase = new PrismaClient({
    datasources: {
      db: {
        url: supabaseUrl
      }
    }
  });

  try {
    const userCount = await prismaSupabase.user.count();
    const provinceCount = await prismaSupabase.province.count();
    console.log(`Supabase User Count: ${userCount}`);
    console.log(`Supabase Province Count: ${provinceCount}`);

    const users = await prismaSupabase.user.findMany({ take: 3 });
    console.log('Supabase Users:', users.map(u => u.email));
  } catch (error) {
    console.error('Error checking Supabase DB:', error);
  } finally {
    await prismaSupabase.$disconnect();
  }
}

async function main() {
  await checkLocal();
  await checkSupabase();
}

main();
