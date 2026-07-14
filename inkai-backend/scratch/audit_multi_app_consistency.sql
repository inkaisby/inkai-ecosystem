-- =============================================================================
-- INKAI Multi-App Database Consistency Audit
-- =============================================================================
-- Target : Supabase PostgreSQL (project ref mzmdhkwleufeiyaspmns)
-- Apps   : inkai-backend, inkai-jatim, inkai-sby (semua menulis ke DB yang sama)
--
-- Cara pakai:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Jalankan file INI dulu (read-only, aman — tidak butuh portal_member_profiles)
--   3. Perhatikan bagian "RINGKASAN" — angka > 0 = ada masalah
--   4. Jika portal_table_missing = 1, jalankan migrasi inkai-jatim dulu, lalu:
--        scratch/audit_multi_app_portal.sql
--
-- Opsional: bagian "FIX" di akhir file DIKOMENTARI — jangan dijalankan tanpa review.
-- =============================================================================

-- =============================================================================
-- 0. RINGKASAN EKSEKUTIF (jalankan ini dulu — cukup copy bagian WITH ... sampai ;)
-- =============================================================================
WITH issues AS (
  -- A. Status Member tidak standar
  SELECT 'member_status_nonstandard' AS issue, COUNT(*)::bigint AS cnt
  FROM "Member" m
  WHERE m."isDeleted" = false
    AND m.status NOT IN ('PENDING', 'Active', 'REJECTED', 'INACTIVE', 'SUSPENDED')

  UNION ALL
  SELECT 'member_status_wrong_casing', COUNT(*)
  FROM "Member" m
  WHERE m."isDeleted" = false
    AND m.status IN ('Pending', 'pending', 'Rejected', 'rejected', 'ACTIVE', 'active')

  UNION ALL
  SELECT 'portal_table_missing', missing.cnt
  FROM (
    SELECT CASE
      WHEN COUNT(*) > 0 THEN 0::bigint
      ELSE 1::bigint
    END AS cnt
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'portal_member_profiles'
  ) missing

  UNION ALL
  -- C. User vs Member integrity
  SELECT 'member_without_user', COUNT(*)
  FROM "Member" m
  WHERE m."isDeleted" = false AND m."userId" IS NULL

  UNION ALL
  SELECT 'user_member_active_mismatch', COUNT(*)
  FROM "User" u
  JOIN "Member" m ON m."userId" = u.id AND m."isDeleted" = false
  WHERE u."isDeleted" = false
    AND (
      (m.status IN ('REJECTED', 'Rejected', 'rejected') AND u."isActive" = true)
      OR (m.status = 'Active' AND u."isActive" = false)
    )

  UNION ALL
  SELECT 'member_user_name_mismatch', COUNT(*)
  FROM "User" u
  JOIN "Member" m ON m."userId" = u.id
  WHERE u."isDeleted" = false AND m."isDeleted" = false
    AND u."fullName" IS NOT NULL AND m."fullName" IS NOT NULL
    AND TRIM(u."fullName") <> TRIM(m."fullName")

  UNION ALL
  -- D. Duplikat / unik
  SELECT 'duplicate_email_active_users', COUNT(*)
  FROM (
    SELECT LOWER(TRIM(email)) AS em
    FROM "User"
    WHERE "isDeleted" = false
    GROUP BY LOWER(TRIM(email))
    HAVING COUNT(*) > 1
  ) x

  UNION ALL
  SELECT 'duplicate_nik_active_members', COUNT(*)
  FROM (
    SELECT LOWER(TRIM(nik)) AS nk
    FROM "Member"
    WHERE "isDeleted" = false AND nik IS NOT NULL AND TRIM(nik) <> ''
    GROUP BY LOWER(TRIM(nik))
    HAVING COUNT(*) > 1
  ) x

  UNION ALL
  SELECT 'duplicate_nia_active_members', COUNT(*)
  FROM (
    SELECT TRIM(nia) AS nn
    FROM "Member"
    WHERE "isDeleted" = false AND nia IS NOT NULL AND TRIM(nia) <> ''
    GROUP BY TRIM(nia)
    HAVING COUNT(*) > 1
  ) x

  UNION ALL
  -- E. Billing
  SELECT 'duplicate_monthly_billing_same_month', COUNT(*)
  FROM (
    SELECT b."memberId", DATE_TRUNC('month', b."dueDate") AS bulan
    FROM "Billing" b
    WHERE b."isDeleted" = false
      AND b.type = 'MONTHLY_IURAN'
    GROUP BY b."memberId", DATE_TRUNC('month', b."dueDate")
    HAVING COUNT(*) > 1
  ) x

  UNION ALL
  SELECT 'billing_paid_without_payment', COUNT(*)
  FROM "Billing" b
  LEFT JOIN "Payment" p ON p."billingId" = b.id
  WHERE b."isDeleted" = false
    AND b.status = 'PAID'
    AND p.id IS NULL

  UNION ALL
  SELECT 'billing_waiting_without_payment', COUNT(*)
  FROM "Billing" b
  LEFT JOIN "Payment" p ON p."billingId" = b.id
  WHERE b."isDeleted" = false
    AND b.status = 'WAITING_VERIFICATION'
    AND p.id IS NULL

  UNION ALL
  SELECT 'billing_on_non_active_member', COUNT(*)
  FROM "Billing" b
  JOIN "Member" m ON m.id = b."memberId"
  WHERE b."isDeleted" = false
    AND m."isDeleted" = false
    AND m.status NOT IN ('Active')
    AND b.status IN ('PENDING', 'WAITING_VERIFICATION', 'PAID')

  UNION ALL
  -- F. Member tanpa role
  SELECT 'member_user_without_member_role', COUNT(*)
  FROM "Member" m
  JOIN "User" u ON u.id = m."userId" AND u."isDeleted" = false
  WHERE m."isDeleted" = false
    AND NOT EXISTS (
      SELECT 1
      FROM "_UserRoles" ur
      JOIN "Role" r ON r.id = ur."A"
      WHERE ur."B" = u.id AND r.name = 'MEMBER'
    )
)
SELECT
  issue,
  cnt,
  CASE WHEN cnt = 0 THEN 'OK' ELSE 'PERLU CEK' END AS status
FROM issues
ORDER BY cnt DESC, issue;


-- =============================================================================
-- A. STATUS MEMBER — distribusi & nilai tidak standar
-- =============================================================================

-- A1. Distribusi semua status (lihat variasi casing)
SELECT
  m.status,
  COUNT(*) AS jumlah,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS persen
FROM "Member" m
WHERE m."isDeleted" = false
GROUP BY m.status
ORDER BY jumlah DESC;

-- A2. Status yang TIDAK mengikuti konvensi (harus diperbaiki)
SELECT
  m.id,
  m."fullName",
  m.status,
  m."userId",
  m."dojoId",
  m."createdAt",
  m."updatedAt"
FROM "Member" m
WHERE m."isDeleted" = false
  AND m.status NOT IN ('PENDING', 'Active', 'REJECTED', 'INACTIVE', 'SUSPENDED')
ORDER BY m."updatedAt" DESC
LIMIT 200;

-- A3. Status casing salah (khusus bug inkai-jatim register)
SELECT
  m.id,
  m."fullName",
  m.status AS status_sekarang,
  CASE
    WHEN m.status IN ('Pending', 'pending') THEN 'PENDING'
    WHEN m.status IN ('Rejected', 'rejected') THEN 'REJECTED'
    WHEN m.status IN ('ACTIVE', 'active') THEN 'Active'
    ELSE m.status
  END AS status_seharusnya,
  m."createdAt"
FROM "Member" m
WHERE m."isDeleted" = false
  AND m.status IN ('Pending', 'pending', 'Rejected', 'rejected', 'ACTIVE', 'active')
ORDER BY m."createdAt" DESC;


-- =============================================================================
-- B. PORTAL JATIM — lewati jika portal_table_missing = 1
--     Jalankan scratch/audit_multi_app_portal.sql setelah migrasi inkai-jatim.
-- =============================================================================
SELECT
  CASE
    WHEN COALESCE((
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'portal_member_profiles'
    ), 0) > 0
      THEN 'portal_member_profiles: ADA — jalankan audit_multi_app_portal.sql'
    ELSE 'portal_member_profiles: BELUM ADA — jalankan migrasi inkai-jatim/supabase/migrations/ dulu'
  END AS portal_status
FROM (SELECT 1) AS _check;


-- =============================================================================
-- C. INTEGRITAS User ↔ Member
-- =============================================================================

-- C1. Member aktif tanpa akun User
SELECT
  m.id,
  m."fullName",
  m.status,
  m."dojoId",
  m."createdAt"
FROM "Member" m
WHERE m."isDeleted" = false
  AND m."userId" IS NULL
ORDER BY m."createdAt" DESC
LIMIT 200;

-- C2. User MEMBER tanpa record Member
SELECT
  u.id,
  u.email,
  u."fullName",
  u."createdAt"
FROM "User" u
JOIN "_UserRoles" ur ON ur."B" = u.id
JOIN "Role" r ON r.id = ur."A" AND r.name = 'MEMBER'
LEFT JOIN "Member" m ON m."userId" = u.id AND m."isDeleted" = false
WHERE u."isDeleted" = false
  AND m.id IS NULL
ORDER BY u."createdAt" DESC
LIMIT 200;

-- C3. User.isActive tidak selaras dengan Member.status
SELECT
  u.id AS user_id,
  u.email,
  u."isActive" AS user_active,
  m.id AS member_id,
  m.status AS member_status,
  m."fullName"
FROM "User" u
JOIN "Member" m ON m."userId" = u.id AND m."isDeleted" = false
WHERE u."isDeleted" = false
  AND (
    (m.status IN ('REJECTED', 'Rejected', 'rejected') AND u."isActive" = true)
    OR (m.status = 'Active' AND u."isActive" = false)
  )
ORDER BY m."updatedAt" DESC
LIMIT 200;

-- C4. Nama berbeda antara User dan Member (satu akun)
SELECT
  u.id,
  u.email,
  u."fullName" AS user_name,
  m."fullName" AS member_name,
  m.status
FROM "User" u
JOIN "Member" m ON m."userId" = u.id
WHERE u."isDeleted" = false
  AND m."isDeleted" = false
  AND u."fullName" IS NOT NULL
  AND m."fullName" IS NOT NULL
  AND TRIM(u."fullName") <> TRIM(m."fullName")
ORDER BY m."updatedAt" DESC
LIMIT 200;


-- =============================================================================
-- D. UNIK: Email, NIK, NIA
-- =============================================================================

-- D1. Email duplikat (aktif)
SELECT
  LOWER(TRIM(u.email)) AS email_normalized,
  COUNT(*) AS jumlah,
  ARRAY_AGG(u.id ORDER BY u."createdAt") AS user_ids
FROM "User" u
WHERE u."isDeleted" = false
GROUP BY LOWER(TRIM(u.email))
HAVING COUNT(*) > 1
ORDER BY jumlah DESC;

-- D2. NIK duplikat (aktif)
SELECT
  LOWER(TRIM(m.nik)) AS nik_normalized,
  COUNT(*) AS jumlah,
  ARRAY_AGG(m.id ORDER BY m."createdAt") AS member_ids,
  ARRAY_AGG(m."fullName" ORDER BY m."createdAt") AS names
FROM "Member" m
WHERE m."isDeleted" = false
  AND m.nik IS NOT NULL
  AND TRIM(m.nik) <> ''
GROUP BY LOWER(TRIM(m.nik))
HAVING COUNT(*) > 1
ORDER BY jumlah DESC;

-- D3. NIA duplikat (aktif)
SELECT
  TRIM(m.nia) AS nia,
  COUNT(*) AS jumlah,
  ARRAY_AGG(m.id ORDER BY m."createdAt") AS member_ids
FROM "Member" m
WHERE m."isDeleted" = false
  AND m.nia IS NOT NULL
  AND TRIM(m.nia) <> ''
GROUP BY TRIM(m.nia)
HAVING COUNT(*) > 1
ORDER BY jumlah DESC;


-- =============================================================================
-- E. SCOPE WILAYAH (Jatim / Surabaya / lintas cabang)
-- =============================================================================

-- E1. Anggota per provinsi & cabang (overview)
SELECT
  pr.name AS provinsi,
  b.name AS cabang,
  m.status,
  COUNT(*) AS jumlah
FROM "Member" m
JOIN "Dojo" d ON d.id = m."dojoId"
JOIN "Branch" b ON b.id = d."branchId"
JOIN "Province" pr ON pr.id = b."provinceId"
WHERE m."isDeleted" = false
  AND d."isDeleted" = false
  AND b."isDeleted" = false
  AND pr."isDeleted" = false
GROUP BY pr.name, b.name, m.status
ORDER BY provinsi, cabang, jumlah DESC;

-- E2. Anggota pending di luar Jawa Timur (mungkin dari register backend tanpa filter)
SELECT
  m.id,
  m."fullName",
  m.status,
  u.email,
  pr.name AS provinsi,
  b.name AS cabang,
  d.name AS dojo,
  m."createdAt"
FROM "Member" m
JOIN "User" u ON u.id = m."userId"
JOIN "Dojo" d ON d.id = m."dojoId"
JOIN "Branch" b ON b.id = d."branchId"
JOIN "Province" pr ON pr.id = b."provinceId"
WHERE m."isDeleted" = false
  AND m.status IN ('PENDING', 'Pending', 'pending')
  AND pr.name NOT ILIKE 'JAWA TIMUR'
ORDER BY m."createdAt" DESC
LIMIT 100;

-- E3. Anggota di cabang SURABAYA dengan status tidak standar
SELECT
  m.id,
  m."fullName",
  m.status,
  u.email,
  d.name AS dojo,
  m."createdAt"
FROM "Member" m
JOIN "User" u ON u.id = m."userId"
JOIN "Dojo" d ON d.id = m."dojoId"
JOIN "Branch" b ON b.id = d."branchId"
WHERE m."isDeleted" = false
  AND b.name ILIKE 'SURABAYA'
  AND m.status NOT IN ('PENDING', 'Active', 'REJECTED')
ORDER BY m."updatedAt" DESC
LIMIT 100;


-- =============================================================================
-- F. BILLING & PAYMENT
-- =============================================================================

-- F1. Distribusi status billing
SELECT
  b.status,
  b.type,
  COUNT(*) AS jumlah
FROM "Billing" b
WHERE b."isDeleted" = false
GROUP BY b.status, b.type
ORDER BY jumlah DESC;

-- F2. Duplikat iuran bulanan (member + bulan yang sama)
SELECT
  m."fullName",
  m.id AS member_id,
  DATE_TRUNC('month', b."dueDate") AS bulan,
  COUNT(*) AS jumlah_tagihan,
  ARRAY_AGG(b.id ORDER BY b."createdAt") AS billing_ids,
  ARRAY_AGG(b.status ORDER BY b."createdAt") AS statuses
FROM "Billing" b
JOIN "Member" m ON m.id = b."memberId"
WHERE b."isDeleted" = false
  AND b.type = 'MONTHLY_IURAN'
GROUP BY m.id, m."fullName", DATE_TRUNC('month', b."dueDate")
HAVING COUNT(*) > 1
ORDER BY jumlah_tagihan DESC
LIMIT 100;

-- F3. Billing PAID tanpa Payment
SELECT
  b.id,
  b."memberId",
  m."fullName",
  b.type,
  b.amount,
  b.status,
  b."dueDate",
  b."createdAt"
FROM "Billing" b
JOIN "Member" m ON m.id = b."memberId"
LEFT JOIN "Payment" p ON p."billingId" = b.id
WHERE b."isDeleted" = false
  AND b.status = 'PAID'
  AND p.id IS NULL
ORDER BY b."updatedAt" DESC
LIMIT 100;

-- F4. Billing WAITING_VERIFICATION tanpa bukti Payment
SELECT
  b.id,
  m."fullName",
  b.type,
  b.amount,
  b.status,
  b."createdAt"
FROM "Billing" b
JOIN "Member" m ON m.id = b."memberId"
LEFT JOIN "Payment" p ON p."billingId" = b.id
WHERE b."isDeleted" = false
  AND b.status = 'WAITING_VERIFICATION'
  AND p.id IS NULL
ORDER BY b."createdAt" DESC
LIMIT 100;

-- F5. Tagihan aktif untuk anggota yang belum Active
SELECT
  b.id,
  m."fullName",
  m.status AS member_status,
  b.type,
  b.amount,
  b.status AS billing_status,
  b."dueDate"
FROM "Billing" b
JOIN "Member" m ON m.id = b."memberId"
WHERE b."isDeleted" = false
  AND m."isDeleted" = false
  AND m.status NOT IN ('Active')
  AND b.status IN ('PENDING', 'WAITING_VERIFICATION', 'PAID')
ORDER BY b."createdAt" DESC
LIMIT 100;


-- =============================================================================
-- G. VERIFICATION (pengajuan mutasi / prestasi — BUKAN verifikasi pendaftaran)
-- =============================================================================

-- G1. Distribusi status & tipe
SELECT
  v.status,
  v.type,
  COUNT(*) AS jumlah
FROM "Verification" v
GROUP BY v.status, v.type
ORDER BY jumlah DESC;

-- G2. Pengajuan PENDING lebih dari 30 hari
SELECT
  v.id,
  v.type,
  v.status,
  m."fullName",
  b.name AS cabang,
  d.name AS dojo,
  v."createdAt",
  NOW() - v."createdAt" AS umur
FROM "Verification" v
JOIN "Member" m ON m.id = v."memberId"
JOIN "Dojo" d ON d.id = m."dojoId"
JOIN "Branch" b ON b.id = d."branchId"
WHERE v.status = 'PENDING'
  AND v."createdAt" < NOW() - INTERVAL '30 days'
ORDER BY v."createdAt" ASC
LIMIT 100;


-- =============================================================================
-- H. ROLE & AKSES ADMIN
-- =============================================================================

-- H1. User dengan banyak role admin sekaligus (potensi scope bentrok)
SELECT
  u.id,
  u.email,
  u."fullName",
  ARRAY_AGG(r.name ORDER BY r.name) AS roles,
  u."managedProvinceId",
  u."managedBranchId",
  u."managedDojoId"
FROM "User" u
JOIN "_UserRoles" ur ON ur."B" = u.id
JOIN "Role" r ON r.id = ur."A"
WHERE u."isDeleted" = false
  AND r.name LIKE 'ADMIN%'
GROUP BY u.id, u.email, u."fullName",
         u."managedProvinceId", u."managedBranchId", u."managedDojoId"
HAVING COUNT(DISTINCT r.name) > 1
ORDER BY u.email
LIMIT 100;

-- H2. Admin dengan scope ID kosong (bisa akses terlalu luas di beberapa app)
SELECT
  u.id,
  u.email,
  u."fullName",
  ARRAY_AGG(r.name) AS roles,
  u."managedProvinceId",
  u."managedBranchId",
  u."managedDojoId"
FROM "User" u
JOIN "_UserRoles" ur ON ur."B" = u.id
JOIN "Role" r ON r.id = ur."A"
WHERE u."isDeleted" = false
  AND r.name IN ('ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO')
  AND (
    (r.name = 'ADMIN_PROVINCE' AND u."managedProvinceId" IS NULL)
    OR (r.name = 'ADMIN_BRANCH' AND u."managedBranchId" IS NULL)
    OR (r.name = 'ADMIN_DOJO' AND u."managedDojoId" IS NULL)
  )
GROUP BY u.id, u.email, u."fullName",
         u."managedProvinceId", u."managedBranchId", u."managedDojoId"
LIMIT 100;

-- H3. Anggota MEMBER tanpa role MEMBER di _UserRoles
SELECT
  m.id AS member_id,
  m."fullName",
  u.id AS user_id,
  u.email,
  COALESCE(ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) AS roles
FROM "Member" m
JOIN "User" u ON u.id = m."userId" AND u."isDeleted" = false
LEFT JOIN "_UserRoles" ur ON ur."B" = u.id
LEFT JOIN "Role" r ON r.id = ur."A"
WHERE m."isDeleted" = false
GROUP BY m.id, m."fullName", u.id, u.email
HAVING NOT ('MEMBER' = ANY(COALESCE(ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[])))
LIMIT 100;


-- =============================================================================
-- I. CROSS-APP SCENARIO SPOT CHECKS
-- =============================================================================

-- I1. Anggota non-Active yang mungkin masih bisa login di inkai-sby
--     (isMemberLoginBlocked hanya memblokir: PENDING, INACTIVE, REJECTED, SUSPENDED)
--     Status custom seperti "Waiting", "Baru", atau NULL tidak diblokir → risiko login prematur
SELECT
  m.id,
  m."fullName",
  m.status,
  u.email,
  u."isActive",
  b.name AS cabang,
  d.name AS dojo
FROM "Member" m
JOIN "User" u ON u.id = m."userId"
JOIN "Dojo" d ON d.id = m."dojoId"
JOIN "Branch" b ON b.id = d."branchId"
WHERE m."isDeleted" = false
  AND u."isDeleted" = false
  AND u."isActive" = true
  AND m.status NOT IN ('PENDING', 'Pending', 'pending', 'REJECTED', 'Rejected', 'rejected', 'INACTIVE', 'SUSPENDED')
  AND m.status <> 'Active'
ORDER BY m."updatedAt" DESC
LIMIT 100;

-- I2. Anggota Jatim baru (90 hari) per status — tanpa butuh portal_member_profiles
SELECT
  m.status,
  COUNT(*) AS jumlah
FROM "Member" m
JOIN "Dojo" d ON d.id = m."dojoId"
JOIN "Branch" b ON b.id = d."branchId"
JOIN "Province" pr ON pr.id = b."provinceId"
WHERE m."isDeleted" = false
  AND pr.name ILIKE 'JAWA TIMUR'
  AND m."createdAt" >= NOW() - INTERVAL '90 days'
GROUP BY m.status
ORDER BY jumlah DESC;


-- =============================================================================
-- FIX OPSIONAL (DIKOMENTARI — review manual sebelum jalankan!)
-- =============================================================================

/*
-- FIX-1: Normalisasi casing status Member
UPDATE "Member"
SET status = CASE
  WHEN status IN ('Pending', 'pending') THEN 'PENDING'
  WHEN status IN ('Rejected', 'rejected') THEN 'REJECTED'
  WHEN status IN ('ACTIVE', 'active') THEN 'Active'
  ELSE status
END,
"updatedAt" = NOW()
WHERE "isDeleted" = false
  AND status IN ('Pending', 'pending', 'Rejected', 'rejected', 'ACTIVE', 'active');

-- FIX-2: User.isActive selaras dengan Member.status
UPDATE "User" u
SET "isActive" = CASE
  WHEN m.status = 'Active' THEN true
  WHEN m.status IN ('REJECTED', 'Rejected', 'rejected') THEN false
  ELSE u."isActive"
END,
"updatedAt" = NOW()
FROM "Member" m
WHERE m."userId" = u.id
  AND m."isDeleted" = false
  AND u."isDeleted" = false
  AND (
    (m.status IN ('REJECTED', 'Rejected', 'rejected') AND u."isActive" = true)
    OR (m.status = 'Active' AND u."isActive" = false)
  );

-- FIX portal (FIX-3, FIX-4): lihat audit_multi_app_portal.sql
*/
