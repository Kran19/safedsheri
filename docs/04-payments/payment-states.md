# Payment State Machine — Safed Sheri

## 1. State Machine Diagram

```text
               ┌───────────────► PAYMENT_REJECTED (Discrepancy / Counterfeit)
               │
PAYMENT_PENDING ┼───────────────► PAYMENT_RECEIVED (Cash in hand, unverified)
               │                       │
               │                       ▼
               └───────────────► PAYMENT_VERIFIED (Pass activated)
                                       │
                                       ▼ (If event cancelled)
                                 REFUND_REQUIRED ──► REFUNDED
```

## 2. State Descriptions

* `PAYMENT_PENDING`: Initial state upon booking creation. Pass is unactivated.
* `PAYMENT_RECEIVED`: Cash presented at counter but undergoing count/verification.
* `PAYMENT_VERIFIED`: Cash verified, recorded, and reconciled. Pass activated.
* `PAYMENT_REJECTED`: Discrepancy detected (insufficient cash, counterfeit, invalid booking). Pass remains inactive.
* `REFUND_REQUIRED`: Flagged for refund strictly in event cancellation scenarios.
* `REFUNDED`: Refund processed and completed.

---
*Document Part of Safed Sheri Master Specifications.*
