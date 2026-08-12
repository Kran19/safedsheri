# Cash Counter Operations — Safed Sheri

## 1. Cash Counter Model

Physical cash counters are deployed at designated Safed Sheri outlets prior to and on event day.

Every cash transaction recorded in the system must explicitly capture:
* `payment_id`: Unique database identifier.
* `booking_id`: Associated reservation reference.
* `cash_counter_id`: Location/terminal identifier.
* `executive_id`: User ID of the operating Finance Executive.
* `amount_due`: Exact expected amount.
* `amount_paid`: Physical cash collected.
* `payment_status`: Status (`VERIFIED`, `REJECTED`, etc.).
* `verification_timestamp`: Exact ISO timestamp of approval.

## 2. Cash Counter Terminal Requirements

* **Responsive & High Contrast:** Touch-friendly layout optimized for fast search by booking reference or phone number.
* **Instant Feedback:** Visual confirmation banner upon pass activation.
* **Cash Reconciliation:** Summary widget tracking total cash collected by counter ID during active shift.

---
*Document Part of Safed Sheri Master Specifications.*
