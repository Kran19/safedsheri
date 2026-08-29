-- ============================================================
-- STEP 1: Find Meghana's registration (ALL statuses, incl. soft-deleted)
-- ============================================================
SELECT 
  a."fullName",
  a.phone,
  a."aadhaarMasked",
  r."registrationNumber",
  r.status,
  r."deletedAt",
  r."createdAt",
  ra."isPrimary"
FROM "Attendee" a
JOIN "RegistrationAttendee" ra ON ra."attendeeId" = a.id
JOIN "Registration" r ON r.id = ra."registrationId"
WHERE 
  a."fullName" ILIKE '%meghana%' 
  OR a.phone LIKE '%9033582433%';

-- ============================================================
-- STEP 2: Once you see the registrationNumber, run this to unblock her
-- (Replace SS-2026-XXXXXX with actual registrationNumber from Step 1)
-- ============================================================

-- Option A: Soft-delete + cancel the stuck registration
-- UPDATE "Registration"
-- SET "deletedAt" = NOW(), status = 'CANCELLED'
-- WHERE "registrationNumber" = 'SS-2026-XXXXXX'
--   AND "deletedAt" IS NULL;

-- Option B: If it was already soft-deleted but status not CANCELLED,
-- just update the status so the duplicate check won't block her
-- UPDATE "Registration" 
-- SET status = 'CANCELLED'
-- WHERE "registrationNumber" = 'SS-2026-XXXXXX';

-- ============================================================
-- STEP 3: Verify she is unblocked
-- ============================================================
-- SELECT r."registrationNumber", r.status, r."deletedAt"
-- FROM "Registration" r
-- JOIN "RegistrationAttendee" ra ON ra."registrationId" = r.id
-- JOIN "Attendee" a ON a.id = ra."attendeeId"
-- WHERE a."fullName" ILIKE '%meghana%'
--   AND r."deletedAt" IS NULL
--   AND r.status NOT IN ('REJECTED', 'CANCELLED', 'PAYMENT_FAILED');
-- Expected: 0 rows (she is now unblocked)
