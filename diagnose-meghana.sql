-- Run this on your VPS psql to diagnose Meghana's issue:
-- psql -U postgres -d safedsheri

-- Step 1: Find the Attendee record by any matching detail
SELECT 
  a.id as attendee_id,
  a."fullName",
  a.phone,
  a."aadhaarMasked",
  a."createdAt"
FROM "Attendee" a
WHERE 
  a."fullName" ILIKE '%meghana%' 
  OR a.phone LIKE '%9033582433%'
  OR a."aadhaarMasked" LIKE '%1115%';

-- Step 2: Find all registrations linked to that attendee (including soft-deleted)
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
  OR a.phone LIKE '%9033582433%'
  OR a."aadhaarMasked" LIKE '%1115%';
