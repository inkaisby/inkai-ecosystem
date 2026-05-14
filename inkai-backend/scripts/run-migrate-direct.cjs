/**
 * Supabase pooled URI → direct `db.<ref>.supabase.co:5432` + user `postgres`.
 *
 * Produksi Anda sudah ada isi DB tetapi belum dibaseline Prisma Migrate → bisa P3005.
 * Jalankan baseline otomatis untuk migrasi pertama, lalu `migrate deploy`.
 */
require("dotenv").config();

const { execSync } = require("child_process");
const path = require("path");

const cwd = path.join(__dirname, "..");

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("[migrate-direct] DATABASE_URL hilang.");
  process.exit(1);
}

let url;
try {
  url = new URL(raw);
} catch {
  console.error("[migrate-direct] DATABASE_URL tidak valid sebagai URL.");
  process.exit(1);
}

const decodedUser = decodeURIComponent(url.username.replace(/\+/g, " "));
const m = /^postgres\.(.+)$/i.exec(decodedUser);

if (!m) {
  console.error("[migrate-direct] Username harus pola postgres.<PROJECT_REF> (URI pool Supabase).");
  process.exit(1);
}

const projectRef = m[1];
const password = url.password.replace(/\+/g, " ");
const directUrl = `postgresql://${encodeURIComponent("postgres")}:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432${url.pathname}?sslmode=require`;

const env = { ...process.env, DATABASE_URL: directUrl };

function safeResolve(appliedMigration) {
  try {
    execSync(`npx prisma migrate resolve --applied "${appliedMigration}"`, {
      cwd,
      env,
      stdio: "inherit",
    });
  } catch {
    console.log(
      `[migrate-direct] resolve --applied ${appliedMigration} dilewati (sudah tercatat atau tidak cocok — bisa normal).`,
    );
  }
}

safeResolve("20260514120000_add_app_setting");

try {
  execSync("npx prisma migrate deploy", { cwd, env, stdio: "inherit" });
} catch {
  console.error("[migrate-direct] migrate deploy gagal.");
  console.error(
    'Jika error karena kolom sudah ada, jalankan sekali:\n  npx prisma migrate resolve --applied "20260514143000_user_reset_password_tokens"',
  );
  process.exit(1);
}
