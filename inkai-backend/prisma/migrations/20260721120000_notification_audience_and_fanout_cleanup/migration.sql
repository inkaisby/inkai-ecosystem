-- AlterTable
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "audience" TEXT NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_audience_createdAt_idx" ON "Notification"("audience", "createdAt");

-- Tag known admin-ops rows
UPDATE "Notification"
SET "audience" = 'ADMIN'
WHERE title IN (
  'Anggota mendaftar kegiatan mandiri',
  'Pendaftaran Event Baru',
  'Pendaftaran Event (oleh pengurus)',
  'Pendaftaran Event Diperbarui',
  'Anggota Baru Terdaftar',
  'Susunan pengurus diperbarui',
  'Akun admin wilayah baru',
  'Perubahan akun wilayah',
  'Kredensial user baru',
  'Password direset'
)
OR title LIKE 'Periode UKT % dibuka'
OR title LIKE 'Pendaftaran UKT dibuka:%'
OR title LIKE 'Pengingat: batas UKT%'
OR title LIKE 'Batas pendaftaran UKT diperpanjang'
OR title LIKE '[PIC] %';

-- Hapus fan-out salah: notif ops admin yang tersimpan di akun non-admin
DELETE FROM "Notification" n
WHERE n."audience" = 'ADMIN'
  AND (
    n."userId" IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM "_UserRoles" ur
      INNER JOIN "Role" r ON r.id = ur."B"
      WHERE ur."A" = n."userId"
        AND r.name IN (
          'ADMINISTRATOR',
          'ADMIN_PUSAT',
          'ADMIN_PROVINCE',
          'ADMIN_BRANCH',
          'ADMIN',
          'ADMIN_DOJO'
        )
    )
  );
