# Payment Flow — Safed Sheri

## 1. Cash-First Payment Workflow

Safed Sheri operates on a physical cash collection model. The digital platform records reservations and handles verification, while monetary exchange occurs physically at designated Safed Sheri cash counters.

```text
[ Attendee Arrives at Cash Counter ]
                 │
                 ▼
[ Provides Booking Ref or Phone No ]
                 │
                 ▼
[ Finance Exec Searches System ]
                 │
                 ▼
[ System Displays Amount Payable ]
                 │
                 ▼
[ Executive Receives Cash ]
                 │
                 ▼
[ Exec Clicks "Verify Payment" ] ──► [ System Updates Status to VERIFIED ]
                                 ──► [ Triggers Pass Activation ]
                                 ──► [ Sends WhatsApp Confirmation ]
```

## 2. Counter Operational Steps

1. Attendee presents `Booking Reference` (e.g., `SS-2026-89A7`) or WhatsApp Phone Number to the Ticketing & Finance Executive.
2. Executive inputs the reference into the counter interface.
3. System fetches booking details: Attendee Name, Pass Quantities, Total Amount Due (`₹`).
4. Executive counts physical cash received and compares with Amount Due.
5. Executive confirms payment. The system records executive ID, counter ID, timestamp, and amount received.
6. Pass is activated instantly.

---
*Document Part of Safed Sheri Master Specifications.*
