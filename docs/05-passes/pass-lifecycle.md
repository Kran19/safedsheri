# Pass Lifecycle — Safed Sheri

## 1. Lifecycle Diagram

```text
BOOKING_CREATED ──► PAYMENT_PENDING ──► PAYMENT_VERIFIED ──► PASS_ACTIVATED
                                                                  │
                                                                  ▼
PASS_USED ◄── ENTRY_VERIFIED ◄── FACE_AUTH_SUCCESS ◄── READY_FOR_ENTRY
```

## 2. Exceptional States

* `CANCELLED`: Pass invalidated due to booking cancellation.
* `EXPIRED`: Unpaid booking timed out.
* `BLOCKED`: Pass flagged/blocked by Super Administrator due to security or dress code policy violation.
* `INVALID`: Tampered or invalid QR signature.

## 3. Pass Card Characteristics

When active (`PASS_ACTIVATED`), the digital pass card displays:
* Unique Cryptographic QR Code.
* Attendee Name & Pass Category (Single / Couple / Gazebo Level).
* Booking Reference.
* Mandatory Policy Reminder: White Dress Code Compulsory.
* Anti-screenshot visual verification indicators.

---
*Document Part of Safed Sheri Master Specifications.*
