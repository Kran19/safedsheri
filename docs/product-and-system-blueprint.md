# SAFED SHERI — MASTER PRODUCT & SYSTEM BLUEPRINT

> **Version:** 1.0.0  
> **Status:** Discovery & Specifications Phase (Phase 0)  
> **Brand Statement:** "One Night, One Colour, Infinite Memories."  

---

## 1. Executive Summary

**Safed Sheri** is an exclusive, ultra-premium annual Garba festival. It operates on a high-exclusivity event model centered around a single night, a single defining theme (White), and a highly curated attendee experience.

The digital ecosystem for Safed Sheri serves two distinct purposes:
1. **Public Brand Experience:** An immersive, cinematic, 3D storytelling web interface that introduces attendees to the world of Safed Sheri and handles ticket reservations, pass access, and application workflows.
2. **Operational Core:** A fast, rock-solid, security-focused operational management system handling passwordless WhatsApp OTP authentication, physical cash counter payment verification, backend-authenticated QR digital pass activation, gate entry verification, face authentication dependencies, and administrative/financial auditing.

This document serves as the **Master Technical Blueprint** for the Safed Sheri platform. It documents all product specifications, business rules, entities, state machines, operational flows, permission models, edge cases, failure scenarios, and open architectural decisions prior to any production software implementation.

---

## 2. Product Definition

Safed Sheri is not a traditional ticketing application. It is a multi-tier physical-digital event platform with strict identity verification and payment control models.

### Key Characteristics
* **Frequency:** Annual (Occurs once per year).
* **Ticketing Mechanism:** Reserve online via WhatsApp OTP identity → Pay cash at physical authorized Safed Sheri counters → Finance executive verifies cash → Pass activated digitally → Digital QR + Face verification at event gate.
* **Exclusivity:** White dress code is strictly compulsory for all attendees without exception. Passes are non-transferable.
* **Architecture Boundary:** Separation of Public Experience (high visual/3D aesthetic) and Operational Tools (ultra-fast, responsive, minimal data footprint, high-reliability mobile tools).

---

## 3. Brand Understanding

* **Event Name:** Safed Sheri
* **Social Identity:** `SafedSheri`
* **Instagram:** [https://www.instagram.com/safedsheri/](https://www.instagram.com/safedsheri/)
* **Tagline:** *"One Night, One Colour, Infinite Memories."*
* **Brand Sentiment:** `GRATEFUL - THANKFUL ♥️`
* **Visual Direction:** "Safed" (White) represents celebration, purity, light, unity, community, and elegance. The digital branding balances pristine whites with deep nocturnal contrast, cinematic lighting, and subtle micro-animations.

---

## 4. Business Rules

### Rule 1: Mandatory White Dress Code
* **Canonical Policy:**
  > White dress code is compulsory.  
  > No entry will be permitted without adhering to the mandatory white dress code. This policy applies to all attendees, including children.
* **Scope:** Universal across all ticket tiers, gazebos, VIPs, adults, children, and staff.

### Rule 2: Strict Pass Non-Transferability
* **Canonical Policy:**
  > Passes are strictly non-transferable and cannot be forwarded or shared.
* **Enforcement:** Pass verification relies on live backend lookup, authenticated attendee profiles, and mandatory face authentication matching at the gate. Screenshots, forwarded images, or unverified QRs are automatically rejected.

### Rule 3: Strict Refund Policy
* **Canonical Policy:**
  > No refunds will be issued unless the event is cancelled by the organisers.

### Rule 4: Physical Cash Verification Model
* Booking creation does **NOT** equal payment completion or pass activation. Passes remain `PENDING` until an authorized Ticketing & Finance Executive receives cash at an official counter and explicitly updates payment status to `VERIFIED`.

---

## 5. User Roles & Descriptions

1. **Attendee / Guest:** Public user booking passes, verifying via WhatsApp OTP, making physical cash payments at designated counters, viewing active passes, and presenting QR at event entry.
2. **Ticketing & Finance Executive:** Field staff operating physical cash counters. Responsible for searching pending bookings, receiving physical cash, verifying transaction amounts, and activating digital passes.
3. **Entry Verification Officer:** Gate security staff. Operates mobile scanner interface to scan attendee QRs, inspect live pass status, verify identity/face authentication, check dress code compliance, and record entry/denial.
4. **Super Administrator:** Platform administrators with complete operational oversight: event setup, ticket pricing phases, gazebo allocation, booking management, cash counter auditing, user/staff management, analytics, and system configuration.

---

## 6. Permission Matrix

| Capability / Resource | Attendee | Ticketing & Finance Executive | Entry Verification Officer | Super Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **Explore Public Experience** | YES | YES | YES | YES |
| **Create Booking** | YES (Own) | YES (Assisted) | NO | YES |
| **Verify Phone (WhatsApp OTP)** | YES | N/A | N/A | N/A |
| **View Booking Status** | OWN ONLY | ASSIGNED / SEARCH | MINIMAL | YES (All) |
| **Search Pending Bookings** | NO | YES | NO | YES |
| **Record Cash Payment** | NO | YES | NO | YES |
| **Verify Payment & Activate Pass** | NO | YES | NO | YES |
| **Access Digital Pass / QR** | OWN ONLY | OPERATIONAL | MINIMAL | YES |
| **Scan Pass QR** | NO | OPTIONAL | YES | YES |
| **Perform Face Verification** | NO | NO | YES | YES |
| **Approve / Deny Gate Entry** | NO | NO | YES (System Guided) | YES (With Override) |
| **Manage Pricing & Inventory** | NO | NO | NO | YES |
| **Manage Gazebos** | NO | NO | NO | YES |
| **Manage Sponsor / Stall Leads** | NO | NO | NO | YES |
| **Manage Staff Accounts** | NO | NO | NO | YES |
| **Access Financial Audits** | NO | LIMITED (Own Counter) | NO | YES (Full) |
| **Configure Event Settings** | NO | NO | NO | YES |

---

## 7. Ticket Architecture

The system categorizes passes into two primary structures: **Standard Tickets** and **Gazebo Passes**.

### Standard Ticket Types
1. **Single Pass:** Valid for 1 individual.
2. **Couple Pass:** Valid for 1 couple (2 individuals evaluated as a single booking unit or separate attendee identities).

---

## 8. Pricing Architecture & Phases

Ticket prices scale across three administrative phases. Pricing phases must be dynamic, database-driven, and time/inventory bound.

| Ticket Type | Early Bird Phase | Phase 1 | Phase 2 |
| :--- | :---: | :---: | :---: |
| **Single Pass** | ₹3,500 | ₹4,000 | ₹4,500 |
| **Couple Pass** | ₹6,500 | ₹7,500 | ₹9,000 |

*Note: Pricing phase transitions, start/end timestamps, and active status are managed by the Super Administrator.*

---

## 9. Gazebo Architecture

Gazebos represent premium private enclosure bookings. Gazebos launch simultaneously across 3 tiers, with a strict global inventory cap of **12 gazebos** total.

| Level / Category | Price per Gazebo | Quantity Available | Total Tier Inventory |
| :--- | :---: | :---: | :---: |
| **Level 1** | ₹85,000 | 4 | 4 Gazebos |
| **Level 2** | ₹1,00,000 | 4 | 4 Gazebos |
| **Level 3** | ₹1,25,000 | 4 | 4 Gazebos |
| **TOTAL** | — | — | **12 Gazebos** |

*Note: Gazebo inventory is locked and tracked independently from standard tickets to prevent double-booking.*

---

## 10. Booking Lifecycle

```text
[ Attendee Visits Site ]
          │
          ▼
[ Selects Tickets / Gazebos ]
          │
          ▼
[ Enters Attendee Info ]
          │
          ▼
[ WhatsApp OTP Verification ] ──(Fails)──► [ Retry OTP ]
          │ (Success)
          ▼
[ Booking Created: Status = CREATED, Payment = PENDING ]
          │
          ▼
[ Generates Booking Reference & Payment Instructions ]
          │
          ▼
[ Attendee Visits Physical Cash Counter ]
          │
          ▼
[ Finance Executive Searches & Collects Cash ]
          │
          ▼
[ Executive Verifies Payment in System ]
          │
          ▼
[ Booking Status = VERIFIED, Payment = VERIFIED, Pass = ACTIVATED ]
          │
          ▼
[ Digital Pass Issued via Web App & Sent via WhatsApp ]
```

---

## 11. Payment Lifecycle

Physical cash workflow requires explicit state transitions:

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

---

## 12. Pass Lifecycle

Passes undergo strict server-side state enforcement:

```text
BOOKING_CREATED ──► PAYMENT_PENDING ──► PAYMENT_VERIFIED ──► PASS_ACTIVATED
                                                                  │
                                                                  ▼
PASS_USED ◄── ENTRY_VERIFIED ◄── FACE_AUTH_SUCCESS ◄── READY_FOR_ENTRY
```

*Exceptional States:* `CANCELLED`, `EXPIRED`, `BLOCKED`, `INVALID`.

---

## 13. QR System Architecture

* **Backend-Authenticated QR:** QR codes do not store raw JSON or unencrypted attendee details. Instead, they contain a cryptographically signed token or high-entropy UUID reference key (e.g., `ss_pass_v1_9f8b7a6c5d4e3f2a`).
* **Validation:** Entry scanners read the QR token and hit the server backend. The backend validates:
  1. Token authenticity & signature validity.
  2. Booking status == `VERIFIED`.
  3. Pass status == `PASS_ACTIVATED` / `READY_FOR_ENTRY`.
  4. Pass usage count == `0` (Not previously scanned/used).
  5. Active Event Match == Current Event ID.
* **Anti-Screenshot & Dynamic Refresh (Recommended):** To mitigate screenshot sharing, digital pass displays can implement time-decay dynamic QR tokens or backend-verified face verification steps.

---

## 14. Entry Verification Lifecycle

```text
[ Attendee Presents QR at Gate ]
               │
               ▼
[ Scanner Scans QR Code ]
               │
               ▼
[ Server Validates QR & Booking State ]
               │
         ┌─────┴────────────────────────┐
   (Valid Pass)                   (Invalid / Used / Unpaid)
         │                              │
         ▼                              ▼
[ Prompt Face Authentication ]    [ Display DENIED Screen ]
         │                        [ State Specific Reason ]
   (Face Matches)                       │
         │                              ▼
         ▼                        [ Log Security Alert ]
[ Inspect White Dress Code ]
         │
         ▼
[ Officer Approves Entry ]
         │
         ▼
[ Pass Status = PASS_USED ]
[ Record Entry Timestamp & Officer ID ]
```

---

## 15. Face-Authentication Dependency

Face authentication forms a mandatory secondary validation layer prior to gate entry approval.

* **Process Integration:** Scan QR → Backend Match Pass → Display Stored Attendee Image / Trigger Live Face Verification → Confirm Match → Gate Unlocked.
* **Architectural Boundary:** Final selection of vendor, biometric hashing algorithm, camera SDK, and privacy compliance framework is categorized under **OPEN DECISION #10 & #11**.

---

## 16. WhatsApp / OTP Architecture

WhatsApp serves as the primary communication channel and authentication mechanism (Passwordless System).

### Workflow Triggers
1. **Authentication:** Attendee enters mobile number → System sends 6-digit OTP via WhatsApp → User verifies.
2. **Booking Created:** Automated WhatsApp message with `Booking Reference`, `Amount Due`, `Selected Tickets`, and `Cash Counter Locations`.
3. **Payment Completed:** Automated WhatsApp notification with `Pass Activation Link`, `Digital Pass Card`, and `Event Instructions`.
4. **Event Reminders:** Pre-event broadcast emphasizing the compulsory White Dress Code and Gate Entry Guidelines.

---

## 17. Sponsor & Stall Workflow

1. **Public Lead Capture:** Dedicated minimal forms on website (`/participate/sponsor` and `/participate/stall`).
2. **Data Collection:** Business name, contact person, phone, email, sponsorship tier / stall type preference, offering description.
3. **Admin Pipeline:** Super Administrator reviews submissions in Admin Portal, updates application statuses (`NEW`, `IN_REVIEW`, `CONTACTED`, `APPROVED`, `REJECTED`), and records notes.

---

## 18. Administrative Architecture

The Super Administrator Portal comprises 11 functional modules:
1. **Event Management:** Multi-year event configuration, venue info, dates, operational status.
2. **Ticket & Pricing Management:** Create/update pricing phases, set start/end dates, assign ticket prices, toggle availability.
3. **Gazebo Management:** Real-time inventory grid across Level 1, 2, and 3 gazebos.
4. **Booking Management:** Master search/filter grid across all bookings, payment states, and attendee details.
5. **Finance & Counter Management:** Cash counter registration, executive assignments, daily cash reconciliation reports.
6. **Attendee Management:** Search attendee directory, view WhatsApp verification status, linked bookings, and pass history.
7. **Entry Management:** Live gate dashboard monitoring scan throughput, approved entries, rejections, and peak gate load.
8. **Sponsor Application Management:** Lead management pipeline for event sponsors.
9. **Stall Application Management:** Application review and allocation system for vendor stalls.
10. **Staff & Role Management:** Account provisioning and role assignment for Finance Executives and Entry Officers.
11. **System Audit Logs:** Immutable record of financial status changes, pass overrides, inventory updates, and admin actions.

---

## 19. Event-Day Operational Workflow

* **Cash Counters (Pre-Event & Event Day):**
  * High-density physical setups with offline/online hybrid terminals.
  * Executive inputs Booking Ref or Phone No → Displays exact amount due → Accepts physical cash → Presses "Confirm Cash Received" → Pass instantly activated.
* **Gate Verification (Event Evening):**
  * Handheld mobile devices with high-speed camera scanning.
  * Sub-second server validation response (<300ms target).
  * High visual feedback: Bright Green Full Screen for `APPROVED`, Bold Red Full Screen for `DENIED`.

---

## 20. Data / Entity Model

```text
+-------------------+       +-------------------+       +-------------------+
|      Events       |1    * |   TicketPhases    |1    * |    TicketTypes    |
|-------------------|-------|-------------------|-------|-------------------|
| id (PK)           |       | id (PK)           |       | id (PK)           |
| name              |       | event_id (FK)     |       | phase_id (FK)     |
| year              |       | phase_name        |       | name (Single/Dbl) |
| venue             |       | start_time        |       | price             |
| date              |       | end_time          |       | inventory         |
| status            |       | is_active         |       | is_active         |
+-------------------+       +-------------------+       +-------------------+
          │
          │ 1
          │
          │ *
+-------------------+       +-------------------+       +-------------------+
|     Gazebos       |       |     Bookings      |1    * |   BookingItems    |
|-------------------|       |-------------------|-------|-------------------|
| id (PK)           |       | id (PK)           |       | id (PK)           |
| event_id (FK)     |       | booking_ref (UNIQ)|       | booking_id (FK)   |
| tier (L1/L2/L3)   |       | user_id (FK)      |       | ticket_type_id(FK)|
| price             |       | total_amount      |       | gazebo_id (FK)    |
| status            |       | payment_status    |       | quantity          |
+-------------------+       | booking_status    |       | unit_price        |
                            +-------------------+       +-------------------+
                                      │                           │
                                      │ 1                         │ 1
                                      │                           │
                                      │ *                         │ *
                            +-------------------+       +-------------------+
                            |     Payments      |       |      Passes       |
                            |-------------------|       |-------------------|
                            | id (PK)           |       | id (PK)           |
                            | booking_id (FK)   |       | booking_item_id   |
                            | counter_id (FK)   |       | pass_code (UNIQ)  |
                            | executive_id (FK) |       | qr_hash (UNIQ)    |
                            | amount_paid       |       | pass_status       |
                            | payment_status    |       | face_auth_ref     |
                            | verified_at       |       | is_used           |
                            +-------------------+       +-------------------+
                                                                  │
                                                                  │ 1
                                                                  │
                                                                  │ *
                                                        +-------------------+
                                                        |    EntryScans     |
                                                        |-------------------|
                                                        | id (PK)           |
                                                        | pass_id (FK)      |
                                                        | officer_id (FK)   |
                                                        | scan_result       |
                                                        | rejection_reason  |
                                                        | scanned_at        |
                                                        +-------------------+
```

---

## 21. State Machines

### A. Booking State Machine
* `DRAFT` ──► `CREATED` ──► `PAYMENT_PENDING` ──► `PAYMENT_VERIFIED` ──► `COMPLETED`
* `PAYMENT_PENDING` ──► `EXPIRED` / `CANCELLED`

### B. Payment State Machine
* `PENDING` ──► `RECEIVED` ──► `VERIFIED`
* `PENDING` ──► `REJECTED`
* `VERIFIED` ──► `REFUND_REQUIRED` ──► `REFUNDED`

### C. Pass State Machine
* `PENDING` ──► `ACTIVE` ──► `READY_FOR_ENTRY` ──► `USED`
* `ACTIVE` ──► `BLOCKED` / `CANCELLED` / `EXPIRED`

### D. Gate Entry State Machine
* `SCAN_INITIATED` ──► `QR_VALIDATED` ──► `FACE_AUTH_PENDING` ──► `APPROVED` (Entry Granted)
* `SCAN_INITIATED` ──► `DENIED` (Reason logged: QR_INVALID, NOT_PAID, ALREADY_USED, DRESS_CODE_VIOLATION, FACE_MISMATCH)

---

## 22. Edge Case Matrix

| Domain | Edge Case Scenario | System Mitigation & Policy |
| :--- | :--- | :--- |
| **Booking** | User abandons booking mid-OTP verification | Booking state remains `DRAFT`; automatically purged after 30 minutes without holding inventory. |
| **Booking** | Same WhatsApp number submits multiple pending bookings | System allows up to 2 active pending bookings per phone number; warns user of unfulfilled existing bookings. |
| **Payment** | Attendee presents partial cash at counter | Finance Executive interface blocks verification unless `cash_received >= amount_due`. Partial payments disallowed. |
| **Payment** | Cash Executive accidentally inputs incorrect payment amount | System requires manager override token to adjust verified payment amounts once recorded. Audit log generated. |
| **Pass** | Attendee attempts entry with screenshot of friend's QR | Gate scan checks face authentication reference image on server. Rejects if face mismatch or already used. |
| **Pass** | Scanner device loses internet connection at gate | System operates queue sync fallback with encrypted local lookup list of activated passes. Syncs scans upon reconnect. |
| **Entry** | Multiple scanners scan the exact same QR simultaneously | Server applies atomic database locking (`SELECT FOR UPDATE`). First scan succeeds; second scan immediately denied as `ALREADY_USED`. |
| **Operations** | Gate staff encounters VIP / Dress Code controversy | System provides "Officer Overridden Denial" with compulsory reason logging and Super Admin escalation notification. |

---

## 23. Security Requirements

1. **Server-Side Source of Truth:** Zero trust in client-side claims. Payment verification and pass activation logic reside exclusively behind authenticated backend endpoints.
2. **Cryptographic QR Identifiers:** QR payload consists of signed HMAC tokens or one-time dynamic nonce references. No plain IDs or PII stored inside QR raw strings.
3. **Role-Based Access Control (RBAC):** Strict JWT/Session scope isolation. Gate scanners cannot access financial records; Finance Executives cannot modify event setup.
4. **Rate Limiting & Fraud Prevention:** OTP requests capped at 3 attempts per 5 minutes per IP/Phone number to prevent SMS/WhatsApp spamming.

---

## 24. Privacy & Biometric Considerations

1. **Data Minimization:** Store only operational data required for identification (Full Name, WhatsApp Phone Number, Booking Reference).
2. **Biometric Security:** Biometric face data (if stored) must be converted to non-reversible mathematical feature vectors/embeddings rather than raw images.
3. **Explicit Consent:** Attendees must provide explicit opt-in consent during booking for event entry identity verification.
4. **Data Retention:** Biometric vectors must be automatically scrubbed from active operational databases within 30 days post-event completion.

---

## 25. Auditability Requirements

Every critical state mutation must record an immutable audit entry into `AuditLogs`:
* **Attributes Tracked:** `timestamp`, `actor_id`, `actor_role`, `action_type`, `target_entity`, `target_id`, `previous_state`, `new_state`, `ip_address`, `device_info`.
* **Audited Actions:** Payment Status Verification, Pass Activation, Manual Override Entry, Inventory Adjustment, Price Change, Staff Account Creation.

---

## 26. Performance Requirements

* **Public Web Experience:**
  * Rich 3D web graphics (Three.js / WebGL / Canvas) operating smoothly at 60 FPS on standard desktop/mobile hardware.
  * Progressive asset loading, lazy-loaded textures, and responsive layouts.
* **Operational Interfaces (Finance & Gate Scanner):**
  * Initial payload < 500KB.
  * QR recognition & backend roundtrip response < 300 milliseconds.
  * Touch-optimized, high-contrast, zero-lag interface for low-light/event-gate environments.

---

## 27. Failure Scenarios & Mitigations

1. **WhatsApp Gateway Outage:** System switches fallback to SMS OTP provider automatically.
2. **Cellular Network Failure at Gate:** Handheld scanners fall back to local high-speed Wi-Fi mesh router deployed at gate, or offline-cached database with cryptographic pass validation.
3. **Power Interruption at Cash Counter:** Counter Executives operate tablet/mobile devices running on internal battery with offline transaction queueing.

---

## 28. Website Information Architecture

```text
/ (Home / Hero 3D Experience)
 ├── /experience (The Story, Visual Atmosphere, Gallery)
 ├── /attend (Pass Pricing, Gazebo Tiers, Booking Entrypoint)
 ├── /booking/status (Lookup Booking via WhatsApp OTP)
 ├── /pass/view (Digital Pass & QR Display)
 ├── /participate (Sponsor & Stall Application Forms)
 ├── /rules (Compulsory White Dress Code & Policy Overview)
 └── /support (WhatsApp Support Launcher & FAQ)
```

---

## 29. Public vs Operational Boundaries

```text
                  ┌───────────────────────────────────────────────┐
                  │          SAFED SHERI DIGITAL ECOSYSTEM         │
                  └───────────────────────┬───────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
   ┌─────────────────────────────┐                 ┌─────────────────────────────┐
   │    PUBLIC BRAND WEBSITE     │                 │   OPERATIONAL TOOLS PLATFORM│
   ├─────────────────────────────┤                 ├─────────────────────────────┤
   │ * 3D / WebGL Atmosphere     │                 │ * Cash Counter Terminal     │
   │ * Visual Storytelling       │                 │ * Entry Gate Scanner App    │
   │ * Ticket & Gazebo Booking   │                 │ * Super Admin Portal        │
   │ * Passwordless OTP Flow     │                 │ * Audit & Financial Reports │
   │ * Sponsor / Stall Forms     │                 │ * Real-Time Gate Monitor    │
   │ * Digital Pass Viewer       │                 │                             │
   └─────────────────────────────┘                 └─────────────────────────────┘
```

---

## 30. Open Decisions (To be finalized before implementation)

> [!IMPORTANT]
> The following 30 architectural and operational decisions remain **OPEN** and require explicit client/team alignment prior to commencing production code execution.

1. **OPEN DECISION #1:** Exact Event Date for the upcoming Safed Sheri edition.
2. **OPEN DECISION #2:** Exact Venue Location and physical address.
3. **OPEN DECISION #3:** Total Single and Couple Ticket Inventory limit per phase.
4. **OPEN DECISION #4:** Automated vs manual transition rules between pricing phases (Early Bird → Phase 1 → Phase 2).
5. **OPEN DECISION #5:** Unpaid Booking Expiry Timeout (e.g., 24 hours vs 48 hours before cancellation).
6. **OPEN DECISION #6:** Future support for Online Payment Gateways (UPI, Cards) alongside Cash Counters.
7. **OPEN DECISION #7:** Exact physical cash counter location list and operator terminal hardware specs.
8. **OPEN DECISION #8:** QR Architecture: Single parent QR code per multi-person booking vs individual QR code per attendee.
9. **OPEN DECISION #9:** Mandatory attendee identity input fields during booking (Full Name, Age, Gender, Photo Upload requirement).
10. **OPEN DECISION #10:** Third-party Face Authentication SDK / Provider selection (e.g., AWS Rekognition, Azure Face API, or custom On-Device ML).
11. **OPEN DECISION #11:** Biometric Data Storage Policy (Storing raw photo vs mathematical vector hash vs manual visual inspection by gate officer).
12. **OPEN DECISION #12:** Legal consent disclaimers and privacy policy text for face processing.
13. **OPEN DECISION #13:** WhatsApp Business API Provider selection (e.g., Meta Direct API, Twilio, Gupshup, Wati).
14. **OPEN DECISION #14:** WhatsApp Official Message Template approval status for transactional notifications.
15. **OPEN DECISION #15:** Dedicated customer support phone number / WhatsApp support channel setup.
16. **OPEN DECISION #16:** Mandatory input fields for Sponsor Application Form.
17. **OPEN DECISION #17:** Mandatory input fields for Stall Application Form.
18. **OPEN DECISION #18:** Partial booking cancellation policy (e.g., cancelling 1 of 3 passes in a single booking).
19. **OPEN DECISION #19:** Attendee profile modification rules after booking confirmation.
20. **OPEN DECISION #20:** Primary contact handling for multi-attendee bookings (Does primary booker receive all passes or individual WhatsApp dispatch?).
21. **OPEN DECISION #21:** Executive Gate Override protocol for VIPs or technical scan errors.
22. **OPEN DECISION #22:** Offline Gate Scanner local DB encryption key distribution strategy.
23. **OPEN DECISION #23:** Number of active handheld scanner devices planned for event night.
24. **OPEN DECISION #24:** Total number of physical cash counters to provision in system setup.
25. **OPEN DECISION #25:** Target hardware specs for staff devices (Android handheld vs iOS vs web app).
26. **OPEN DECISION #26:** Admin automated financial reconciliation reporting frequency and export formats (PDF/CSV).
27. **OPEN DECISION #27:** Recommended Production Tech Stack (e.g., Next.js 14 / Node.js / PostgreSQL / Redis / Tailwind CSS / Three.js).
28. **OPEN DECISION #28:** Cloud Hosting & Deployment Architecture (e.g., Vercel / AWS / Docker Container cluster).
29. **OPEN DECISION #29:** Database schema ORM selection (Prisma / Drizzle / TypeORM).
30. **OPEN DECISION #30:** Penetration testing and security audit schedule prior to launch.

---

## 31. Recommended Implementation Phases

```text
PHASE 0: Discovery, Architecture Blueprint & Specification Sign-off [CURRENT PHASE]
  │
  ▼
PHASE 1: Technical Stack Foundation & Database Entity Migrations
  │
  ▼
PHASE 2: WhatsApp OTP Integration & Core Booking Engine
  │
  ▼
PHASE 3: Cash Counter Finance Terminal & Pass Activation System
  │
  ▼
PHASE 4: Mobile Gate Scanner & Identity Verification Engine
  │
  ▼
PHASE 5: High-Performance 3D Brand Experience Website (Three.js / WebGL)
  │
  ▼
PHASE 6: Super Admin Management Portal & Financial Audit Dashboard
  │
  ▼
PHASE 7: Load Testing, Event-Day Simulations & Gate Stress Testing
```

---
*End of Master Product & System Blueprint.*
