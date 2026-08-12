# Entry Flow — Safed Sheri

## 1. Physical Gate Entry Sequence

```text
[ Attendee Arrives at Venue Gate ]
                 │
                 ▼
[ Presents Digital Pass QR ]
                 │
                 ▼
[ Officer Scans QR with Device Camera ]
                 │
                 ▼
[ Server Validates QR & Payment Status ]
                 │
      ┌──────────┴────────────────────────┐
(Pass Valid & Active)              (Invalid / Unpaid / Used)
      │                                   │
      ▼                                   ▼
[ Face Auth Prompt ]                [ Display DENIED Banner ]
      │                             [ State Exact Denial Reason ]
(Face Matches)                            │
      │                                   ▼
      ▼                             [ Log Rejected Entry Attempt ]
[ Inspect White Dress Code ]
      │
(Dress Code Compliant)
      │
      ▼
[ Officer Clicks "APPROVE ENTRY" ]
      │
      ▼
[ System Marks Pass USED ]
[ Unlocks Gate / Grants Entry ]
```

## 2. Gate Verification Requirements

* **Sub-Second Speed:** QR scan request and response must complete in under 300ms.
* **Unambiguous UI Feedback:** Full-screen solid Green banner for `ENTRY APPROVED`, solid Red banner for `ENTRY DENIED`.
* **Zero Cognitive Load:** Security officers see only necessary verification status, attendee reference photo, and action buttons.

---
*Document Part of Safed Sheri Master Specifications.*
