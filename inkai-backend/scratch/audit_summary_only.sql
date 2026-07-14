-- =============================================================================
-- INKAI Audit — RINGKASAN SAJA (copy & run SELURUH file ini sekaligus)
-- =============================================================================
-- Tidak butuh tabel portal_member_profiles.
-- Hasil: kolom issue | cnt | status
--   cnt = 0  → OK
--   cnt > 0  → PERLU CEK
-- =============================================================================

WITH issues AS (
  SELECT 'member_status_nonstandard' AS issue, COUNT(*)::bigint AS cnt
  FROM "Member" m
  WHERE m."isDeleted" = false
    AND m.status NOT IN ('PENDING', 'Active', 'REJECTED', 'INACTIVE', 'SUSPENDED')

  UNION ALL
  SELECT 'member_status_wrong_casing', COUNT(*)::bigint
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
  SELECT 'member_without_user', COUNT(*)::bigint
  FROM "Member" m
  WHERE m."isDeleted" = false AND m."userId" IS NULL

  UNION ALL
  SELECT 'user_member_active_mismatch', COUNT(*)::bigint
  FROM "User" u
  JOIN "Member" m ON m."userId" = u.id AND m."isDeleted" = false
  WHERE u."isDeleted" = false
    AND (
      (m.status IN ('REJECTED', 'Rejected', 'rejected') AND u."isActive" = true)
      OR (m.status = 'Active' AND u."isActive" = false)
    )

  UNION ALL
  SELECT 'member_user_name_mismatch', COUNT(*)::bigint
  FROM "User" u
  JOIN "Member" m ON m."userId" = u.id
  WHERE u."isDeleted" = false AND m."isDeleted" = false
    AND u."fullName" IS NOT NULL AND m."fullName" IS NOT NULL
    AND TRIM(u."fullName") <> TRIM(m."fullName")

  UNION ALL
  SELECT 'duplicate_email_active_users', COUNT(*)::bigint
  FROM (
    SELECT LOWER(TRIM(email)) AS em
    FROM "User"
    WHERE "isDeleted" = false
    GROUP BY LOWER(TRIM(email))
    HAVING COUNT(*) > 1
  ) x

  UNION ALL
  SELECT 'duplicate_nik_active_members', COUNT(*)::bigint
  FROM (
    SELECT LOWER(TRIM(nik)) AS nk
    FROM "Member"
    WHERE "isDeleted" = false AND nik IS NOT NULL AND TRIM(nik) <> ''
    GROUP BY LOWER(TRIM(nik))
    HAVING COUNT(*) > 1
  ) x

  UNION ALL
  SELECT 'duplicate_nia_active_members', COUNT(*)::bigint
  FROM (
    SELECT TRIM(nia) AS nn
    FROM "Member"
    WHERE "isDeleted" = false AND nia IS NOT NULL AND TRIM(nia) <> ''
    GROUP BY TRIM(nia)
    HAVING COUNT(*) > 1
  ) x

  UNION ALL
  SELECT 'duplicate_monthly_billing_same_month', COUNT(*)::bigint
  FROM (
    SELECT b."memberId", DATE_TRUNC('month', b."dueDate") AS bulan
    FROM "Billing" b
    WHERE b."isDeleted" = false AND b.type = 'MONTHLY_IURAN'
    GROUP BY b."memberId", DATE_TRUNC('month', b."dueDate")
    HAVING COUNT(*) > 1
  ) x

  UNION ALL
  SELECT 'billing_paid_without_payment', COUNT(*)::bigint
  FROM "Billing" b
  LEFT JOIN "Payment" p ON p."billingId" = b.id
  WHERE b."isDeleted" = false AND b.status = 'PAID' AND p.id IS NULL

  UNION ALL
  SELECT 'billing_waiting_without_payment', COUNT(*)::bigint
  FROM "Billing" b
  LEFT JOIN "Payment" p ON p."billingId" = b.id
  WHERE b."isDeleted" = false AND b.status = 'WAITING_VERIFICATION' AND p.id IS NULL

  UNION ALL
  SELECT 'billing_on_non_active_member', COUNT(*)::bigint
  FROM "Billing" b
  JOIN "Member" m ON m.id = b."memberId"
  WHERE b."isDeleted" = false AND m."isDeleted" = false
    AND m.status NOT IN ('Active')
    AND b.status IN ('PENDING', 'WAITING_VERIFICATION', 'PAID')

  UNION ALL
  SELECT 'member_user_without_member_role', COUNT(*)::bigint
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
