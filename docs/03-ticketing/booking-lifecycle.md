# Booking Lifecycle — Safed Sheri

## 1. Lifecycle Overview

The booking lifecycle explicitly separates ticket reservation from payment collection and pass activation.

```text
[ Attendee Selects Passes ]
            │
            ▼
[ WhatsApp OTP Verification ]
            │
            ▼
[ Booking Created: State = PENDING ] ──► [ Generates Booking Reference ]
            │
            ▼
[ Physical Cash Payment at Counter ]
            │
            ▼
[ Finance Executive Verifies Cash ]
            │
            ▼
[ Booking State = VERIFIED ] ──► [ Pass Activated & QR Issued ]
```

## 2. Booking State Definitions

* `DRAFT`: Temporary state while user fills out attendee details and completes OTP.
* `CREATED`: Reservation created in database; awaiting payment.
* `PAYMENT_PENDING`: Booking reference active; user instructed to visit physical cash counter.
* `PAYMENT_VERIFIED`: Cash received and verified by Finance Executive; passes activated.
* `CANCELLED`: Reservation cancelled manually or due to timeout.
* `EXPIRED`: Unpaid reservation expired automatically.

---
*Document Part of Safed Sheri Master Specifications.*
