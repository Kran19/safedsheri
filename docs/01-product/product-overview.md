# Product Overview — Safed Sheri

## 1. Product Vision

**Safed Sheri** is a premium, annual Garba event platform engineered to deliver an exclusive, high-curation cultural experience combined with a digitally controlled, bulletproof operational ecosystem.

Unlike standard mass-market ticketing applications, Safed Sheri is designed around:
* **High Exclusivity:** Mandatory white dress code, non-transferable passes, and verified cash payment workflows.
* **Dual Architecture:** An expressive, 3D visual storytelling web experience for public discovery and booking, coupled with lightweight, sub-second mobile tools for physical cash collection and gate entry verification.
* **Passwordless Identity:** Frictionless authentication via WhatsApp OTP rather than legacy email/password accounts.
* **Strict Physical-Digital Control:** Server-side verified pass lifecycle where online booking reservations require physical counter cash verification before digital passes become active.

## 2. Platform Core Capabilities

```text
                                  ┌───────────────────────────┐
                                  │   SAFED SHERI PLATFORM    │
                                  └─────────────┬─────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
│ Public Web App  │                    │ Finance Engine  │                    │ Entry Gate App  │
├─────────────────┤                    ├─────────────────┤                    ├─────────────────┤
│ * 3D Experience │                    │ * Cash Counters │                    │ * QR Scanner    │
│ * Ticket Select │                    │ * Search Booker │                    │ * Face Auth     │
│ * WhatsApp OTP  │                    │ * Collect Cash  │                    │ * Gate Approval │
│ * Pass Display  │                    │ * Activate Pass │                    │ * Abuse Prevent │
└─────────────────┘                    └─────────────────┘                    └─────────────────┘
```

## 3. Product Principles

1. **Exclusivity First:** The platform enforces strict eligibility, non-transferable pass rules, and white dress code policies at every touchpoint.
2. **Backend as Source of Truth:** Never rely on client-side status. QR codes, payments, and entry permissions require live server verification.
3. **Passwordless Simplicity:** Mobile phone number + WhatsApp OTP is the single identity standard for attendees.
4. **Operational Latency Benchmark:** Operational tools must operate in low-latency environments (<300ms QR scan response).

---
*Document Part of Safed Sheri Master Specifications.*
