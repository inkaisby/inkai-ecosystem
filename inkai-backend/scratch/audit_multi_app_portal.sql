-- =============================================================================
-- INKAI Portal Jatim Audit (portal_member_profiles)
-- =============================================================================
-- PRASYARAT: tabel portal_member_profiles sudah ada di Supabase.
-- Jika belum, jalankan migrasi inkai-jatim berurutan di SQL Editor:
--   1. 20260318_000001_portal_public.sql
--   2. 20260713_000002_portal_auth_members.sql
--   3. 20260713_000003_portal_member_branch.sql
--   4. 20260713_000004_portal_user_member_integration.sql  ← wajib untuk integrasi User/Member
--   5. 20260713_000005_production_hardening.sql
--
-- Cek cepat sebelum lanjut:
-- =============================================================================
SELECT
  CASE
    WHEN COALESCE((
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'portal_member_profiles'
    ), 0) > 0
      THEN 'OK — portal_member_profiles ada'
    ELSE 'ERROR — jalankan migrasi inkai-jatim dulu, lalu run file ini lagi'
  END AS prereq_check
FROM (SELECT 1) AS _check;


-- =============================================================================
-- RINGKASAN PORTAL
-- =============================================================================
WITH issues AS (
  SELECT 'portal_vs_member_mismatch' AS issue, COUNT(*)::bigint AS cnt
  FROM portal_member_profiles p
  JOIN "Member" m ON m.id = p.member_id AND m."isDeleted" = false
  WHERE (p.status = 'approved' AND m.status NOT IN ('Active'))
     OR (p.status = 'rejected' AND m.status NOT IN ('REJECTED', 'Rejected'))
     OR (p.status = 'pending' AND m.status NOT IN ('PENDING', 'Pending', 'pending'))

  UNION ALL
  SELECT 'portal_missing_for_jatim_pending', COUNT(*)
  FROM "Member" m
  JOIN "Dojo" d ON d.id = m."dojoId"
  JOIN "Branch" b ON b.id = d."branchId"
  JOIN "Province" pr ON pr.id = b."provinceId"
  LEFT JOIN portal_member_profiles p ON p.member_id = m.id
  WHERE m."isDeleted" = false
    AND pr.name ILIKE 'JAWA TIMUR'
    AND m.status IN ('PENDING', 'Pending', 'pending')
    AND p.id IS NULL

  UNION ALL
  SELECT 'portal_orphan_records', COUNT(*)
  FROM portal_member_profiles p
  LEFT JOIN "User" u ON u.id = p.user_id
  LEFT JOIN "Member" m ON m.id = p.member_id
  WHERE u.id IS NULL OR m.id IS NULL OR u."isDeleted" = true OR m."isDeleted" = true

  UNION ALL
  SELECT 'portal_dojo_id_mismatch', COUNT(*)
  FROM portal_member_profiles p
  JOIN "Member" m ON m.id = p.member_id AND m."isDeleted" = false
  WHERE p.dojo_id IS NOT NULL AND p.dojo_id <> m."dojoId"
)
SELECT issue, cnt, CASE WHEN cnt = 0 THEN 'OK' ELSE 'PERLU CEK' END AS status
FROM issues
ORDER BY cnt DESC;


-- B1. Ketidaksesuaian status portal vs Member
SELECT
  p.user_id,
  p.member_id,
  p.full_name,
  p.status AS portal_status,
  m.status AS member_status,
  p.branch_name,
  p.dojo_name,
  p.updated_at,
  m."updatedAt" AS member_updated
FROM portal_member_profiles p
JOIN "Member" m ON m.id = p.member_id AND m."isDeleted" = false
WHERE (p.status = 'approved' AND m.status NOT IN ('Active'))
   OR (p.status = 'rejected' AND m.status NOT IN ('REJECTED', 'Rejected'))
   OR (p.status = 'pending' AND m.status NOT IN ('PENDING', 'Pending', 'pending'))
ORDER BY p.updated_at DESC
LIMIT 200;

-- B2. Pending Jatim tanpa portal profile (register lewat SBY/backend)
SELECT
  m.id AS member_id,
  m."fullName",
  m.status,
  u.email,
  b.name AS cabang,
  d.name AS dojo,
  m."createdAt"
FROM "Member" m
JOIN "User" u ON u.id = m."userId"
JOIN "Dojo" d ON d.id = m."dojoId"
JOIN "Branch" b ON b.id = d."branchId"
JOIN "Province" pr ON pr.id = b."provinceId"
LEFT JOIN portal_member_profiles p ON p.member_id = m.id
WHERE m."isDeleted" = false
  AND pr.name ILIKE 'JAWA TIMUR'
  AND m.status IN ('PENDING', 'Pending', 'pending')
  AND p.id IS NULL
ORDER BY m."createdAt" DESC
LIMIT 200;

-- B3. Orphan portal records
SELECT p.id, p.user_id, p.member_id, p.full_name, p.status, p.created_at
FROM portal_member_profiles p
LEFT JOIN "User" u ON u.id = p.user_id
LEFT JOIN "Member" m ON m.id = p.member_id
WHERE u.id IS NULL OR m.id IS NULL OR u."isDeleted" = true OR m."isDeleted" = true
LIMIT 200;

-- B4. dojo_id portal tidak cocok Member.dojoId
SELECT
  p.user_id, p.member_id,
  p.dojo_id AS portal_dojo_id,
  m."dojoId" AS member_dojo_id,
  p.dojo_name, d.name AS dojo_aktual
FROM portal_member_profiles p
JOIN "Member" m ON m.id = p.member_id AND m."isDeleted" = false
LEFT JOIN "Dojo" d ON d.id = m."dojoId"
WHERE p.dojo_id IS NOT NULL AND p.dojo_id <> m."dojoId"
LIMIT 200;

-- B5. Asal register Jatim 90 hari terakhir
SELECT
  CASE WHEN p.id IS NOT NULL THEN 'via_inkai_jatim' ELSE 'via_app_lain' END AS asal_register,
  COUNT(*) AS jumlah
FROM "Member" m
JOIN "Dojo" d ON d.id = m."dojoId"
JOIN "Branch" b ON b.id = d."branchId"
JOIN "Province" pr ON pr.id = b."provinceId"
LEFT JOIN portal_member_profiles p ON p.member_id = m.id
WHERE m."isDeleted" = false
  AND pr.name ILIKE 'JAWA TIMUR'
  AND m."createdAt" >= NOW() - INTERVAL '90 days'
GROUP BY 1
ORDER BY jumlah DESC;


-- =============================================================================
-- FIX PORTAL OPSIONAL (DIKOMENTARI)
-- =============================================================================
/*
-- FIX-P1: Sinkronkan portal_member_profiles dari Member.status
UPDATE portal_member_profiles p
SET
  status = CASE
    WHEN m.status = 'Active' THEN 'approved'
    WHEN m.status IN ('REJECTED', 'Rejected') THEN 'rejected'
    WHEN m.status IN ('PENDING', 'Pending', 'pending') THEN 'pending'
    ELSE p.status
  END,
  updated_at = NOW()
FROM "Member" m
WHERE p.member_id = m.id
  AND m."isDeleted" = false
  AND (
    (p.status = 'approved' AND m.status <> 'Active')
    OR (p.status = 'rejected' AND m.status NOT IN ('REJECTED', 'Rejected'))
    OR (p.status = 'pending' AND m.status NOT IN ('PENDING', 'Pending', 'pending'))
  );

-- FIX-P2: Backfill portal profile untuk pending Jatim yang belum punya
INSERT INTO portal_member_profiles (
  user_id, member_id, branch_id, dojo_id,
  full_name, branch_name, dojo_name, status
)
SELECT
  m."userId", m.id, b.id, d.id,
  m."fullName", b.name, d.name, 'pending'
FROM "Member" m
JOIN "Dojo" d ON d.id = m."dojoId"
JOIN "Branch" b ON b.id = d."branchId"
JOIN "Province" pr ON pr.id = b."provinceId"
LEFT JOIN portal_member_profiles p ON p.member_id = m.id
WHERE m."isDeleted" = false
  AND m."userId" IS NOT NULL
  AND pr.name ILIKE 'JAWA TIMUR'
  AND m.status IN ('PENDING', 'Pending', 'pending')
  AND p.id IS NULL;
*/
