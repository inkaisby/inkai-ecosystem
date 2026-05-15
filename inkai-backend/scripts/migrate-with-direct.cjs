/**
 * Jalankan `prisma migrate deploy` memakai koneksi direct (:5432), tanpa mengubah .env permanen.
 * Set DIRECT_URL di .env (atau env) ke URI direct Supabase; runtime Vercel tetap pakai DATABASE_URL pooler.
 */
require("dotenv").config();

const { execSync } = require("child_process");
const path = require("path");

const cwd = path.join(__dirname, "..");
const direct = process.env.DIRECT_URL?.trim();

if (!direct) {
  console.error(
    "[migrate-with-direct] DIRECT_URL kosong. Isi dengan postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres?sslmode=require",
  );
  process.exit(1);
}

execSync("npx prisma migrate deploy", {
  cwd,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: direct },
});
