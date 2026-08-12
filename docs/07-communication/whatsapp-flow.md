# WhatsApp-First Communication Architecture — Safed Sheri

## 1. Architectural Strategy

WhatsApp is the primary attendee interaction channel. Rather than forcing attendees to maintain traditional portal accounts, all transactional updates, pass access links, and reminders are delivered directly to their verified WhatsApp number.

```text
                                  ┌───────────────────────────┐
                                  │   SAFED SHERI PLATFORM    │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼ (API Webhook Trigger)
                                  ┌───────────────────────────┐
                                  │  WHATSAPP BUSINESS API    │
                                  └─────────────┬─────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
│ OTP Verification│                    │ Booking Created │                    │ Payment Verified│
├─────────────────┤                    ├─────────────────┤                    ├─────────────────┤
│ * 6-Digit Code  │                    │ * Booking Ref   │                    │ * Active Pass   │
│ * Expiry 5 Mins │                    │ * Amount Payable│                    │ * QR Card Link  │
│                 │                    │ * Cash Counters │                    │ * Gate Rules    │
└─────────────────┘                    └─────────────────┘                    └─────────────────┘
```

## 2. Key Interaction Triggers

1. **OTP Verification:** Verification code dispatched upon entering mobile number.
2. **Booking Reservation Created:** Sent immediately when user reserves passes online. Includes Booking Ref and Cash Counter instructions.
3. **Payment Completion Notification:** Sent as soon as Finance Executive approves cash payment. Contains link to digital pass.
4. **Event Countdown & Policy Reminders:** Pre-event broadcast highlighting mandatory White Dress Code.

---
*Document Part of Safed Sheri Master Specifications.*
