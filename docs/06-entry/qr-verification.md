# Gate QR Verification Protocol — Safed Sheri

## 1. Handheld Mobile Scanner Interface

The Entry Verification Officer operates a dedicated mobile camera interface built for rapid scanning under night-time gate conditions.

## 2. Server Response Structure

Upon reading a QR token, the scanner makes a request to `/api/v1/entry/verify-scan`:

```json
{
  "qr_token": "ss_pass_v1_9f8b7a6c5d4e3f2a",
  "officer_id": "usr_officer_102",
  "gate_id": "gate_north_01"
}
```

**Response (Approved Path):**
```json
{
  "status": "VALID",
  "pass_id": "pss_8839201",
  "attendee_name": "Karan Patel",
  "ticket_category": "Couple Pass (1 of 2)",
  "face_auth_image_url": "https://media.safedsheri.com/auth/ref_8839201.jpg",
  "dress_code_policy": "Compulsory White",
  "message": "Pass Active. Proceed to Face Auth & Dress Code check."
}
```

**Response (Denied Path):**
```json
{
  "status": "DENIED",
  "reason_code": "PASS_ALREADY_USED",
  "message": "Pass was already used for entry at Gate North 01 at 20:14:02.",
  "scanned_at": "2026-10-15T20:14:02Z"
}
```

---
*Document Part of Safed Sheri Master Specifications.*
