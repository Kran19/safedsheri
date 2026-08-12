# User Roles — Safed Sheri

## 1. Role Definitions

The platform defines four primary user roles with clear operational boundaries.

```text
                  ┌───────────────────────────────────────────────┐
                  │                 USER ROLES                    │
                  └───────────────────────┬───────────────────────┘
                                          │
    ┌──────────────────┬──────────────────┼──────────────────┐
    ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  ATTENDEE    │   │ TICKETING &  │   │    ENTRY     │   │    SUPER     │
│              │   │   FINANCE    │   │ VERIFICATION │   │ADMINISTRATOR │
│              │   │  EXECUTIVE   │   │   OFFICER    │   │              │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

### 1. Attendee
* **Target User:** Event guest / public customer.
* **Primary Activities:** Explores event details, reserves tickets/gazebos, verifies phone number via WhatsApp OTP, visits cash counter for payment, accesses active digital pass card with QR code, and presents pass at gate.
* **Authentication:** Passwordless WhatsApp OTP.

### 2. Ticketing & Finance Executive
* **Target User:** Event finance & cash counter staff.
* **Primary Activities:** Operates physical cash counters, searches pending bookings by booking reference or phone number, verifies exact cash received, confirms payments in system, and triggers digital pass activation.
* **Authentication:** Secured Staff Login credentials (2FA enabled).

### 3. Entry Verification Officer
* **Target User:** Gate security & entry management staff.
* **Primary Activities:** Operates mobile scanner device at physical gate, scans attendee pass QR code, views instant validation screen (`APPROVED` / `DENIED`), inspects stored face image / face auth verification, checks white dress code compliance, and records gate entry.
* **Authentication:** Secured Mobile Staff Login credentials.

### 4. Super Administrator
* **Target User:** Core event management team / System admins.
* **Primary Activities:** Configures events, pricing phases, gazebo inventory, manages staff accounts, oversees financial reports, monitors gate entry analytics, manages sponsor/stall applications, and accesses immutable audit logs.
* **Authentication:** Enterprise Multi-Factor Authentication (MFA).

---
*Document Part of Safed Sheri Master Specifications.*
