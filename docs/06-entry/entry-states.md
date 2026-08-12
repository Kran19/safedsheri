# Entry States & Denial Reasons — Safed Sheri

## 1. Gate Entry State Machine

```text
[ SCAN_INITIATED ]
        │
        ├──────────────────────────────┐
        ▼                              ▼
[ QR_VALIDATED ]                [ SCAN_FAILED ] ──► DENIED (QR_INVALID)
        │
        ├──────────────────────────────┐
        ▼                              ▼
[ FACE_AUTH_PENDING ]           [ CHECK_FAILED ] ──► DENIED (PAYMENT_PENDING / ALREADY_USED)
        │
        ├──────────────────────────────┐
        ▼                              ▼
[ DRESS_CODE_VERIFIED ]         [ AUTH_FAILED ] ──► DENIED (FACE_MISMATCH)
        │
        ▼
[ ENTRY_APPROVED ] (Pass Marked USED)
```

## 2. Standard Denial Reasons & UI Display

| Denial Reason Code | User-Facing Explanation | Operational Action |
| :--- | :--- | :--- |
| `QR_INVALID` | Invalid or corrupted QR code signature. | Direct guest to Helpdesk / Cash Counter. |
| `PAYMENT_PENDING` | Payment not verified at cash counter. | Direct guest to Cash Counter for payment. |
| `PASS_ALREADY_USED` | Pass was previously scanned for entry. | Security alert triggered; prevent duplicate entry. |
| `FACE_MISMATCH` | Face verification did not match ticket owner. | Pass non-transferable policy enforced; escalate to Supervisor. |
| `DRESS_CODE_VIOLATION` | Attendee is not complying with White Dress Code. | Entry denied until attendee changes into mandatory white attire. |

---
*Document Part of Safed Sheri Master Specifications.*
