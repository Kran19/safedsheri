# Financial Auditability — Safed Sheri

## 1. Audit Requirements

Because physical cash is collected across multiple counters and operators, financial auditability is mandatory.

Every payment state change triggers an immutable entry in `AuditLogs`:
* `actor_id`: Staff account ID initiating action.
* `action`: e.g., `PAYMENT_VERIFY`, `PAYMENT_REJECT`, `AMOUNT_OVERRIDE`.
* `booking_id`: Target booking reference.
* `amount_verified`: Amount recorded.
* `counter_id`: Cash counter location ID.
* `timestamp`: Precise server timestamp.

## 2. Daily Reconciliation & Security Protocols

1. **Shift Reconciliation:** Finance Executives perform end-of-shift cash balancing against system-recorded totals for their `counter_id`.
2. **Discrepancy Reporting:** Discrepancies between physical cash and system totals flag an immediate alert to Super Administrators.
3. **No Direct Database Updates:** Payment status cannot be altered directly via database tools without producing audit logs.

---
*Document Part of Safed Sheri Master Specifications.*
