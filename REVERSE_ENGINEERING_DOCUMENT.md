# Safed Sheri 2026 - Comprehensive Reverse Engineering & Database Architecture Documentation

## Executive Summary & System Overview

**Safed Sheri 2026** is a specialized operational management and high-concurrency event ticketing system designed for Garba and cultural event management in Gujarat, India. The application handles end-to-end workflows including online attendee registrations, Aadhaar document verification, dynamic pricing phase management, Razorpay payment gateway integration, cashier cash collection, QR pass issuance, sub-second gate entry scanning, Gazebo VIP lounge inquiries, and detailed financial reconciliation.

---

## 1. System Architecture & Monorepo Structure

The project is structured as an **NPM Monorepo Workspace** (`package.json` workspaces: `apps/*`, `packages/*`), segregating concerns cleanly between the admin/attendee frontend, NestJS backend API, shared types, and database management.

```
safed-sheri/
├── apps/
│   ├── admin/                    # Next.js 14 App Router (Admin Dashboard & Registration Web App)
│   └── api/                      # NestJS RESTful API Backend Service
├── packages/
│   └── types/                    # Shared TypeScript DTOs, Enums, and Interfaces
├── prisma/
│   ├── schema.prisma             # PostgreSQL Database Schema definition
│   ├── seed.ts                   # Database seeder script
│   └── seed-admins.ts            # Admin user bootstrapping script
├── scratch/                      # Diagnostic and operational maintenance scripts
├── deploy.sh                     # Automated VPS deployment shell script
├── docker-compose.yml            # Production Multi-container Docker configuration
└── docker-compose.local.yml      # Local development Docker setup
```

### Core Technology Stack
- **Frontend Framework**: Next.js 14 (React 18, TypeScript, Tailwind CSS, GSAP, Lenis Smooth Scroll, Lucide Icons, Canvas / HTML5 QR Scanner).
- **Backend Framework**: NestJS 10 (Node.js, Express, Passport.js JWT Authentication, Class Validator, Swagger).
- **Database Engine**: **PostgreSQL 16** (`postgres:16-alpine`).
- **ORM & Database Client**: **Prisma ORM** v5.10.0 (`@prisma/client`).
- **Containerization**: Docker & Docker Compose.
- **Third-Party Integrations**: Razorpay (Payment Gateway), Zaple / Twilio (WhatsApp OTP), Tesseract.js (OCR Document Processing), Nodemailer (SMTP).

---

## 2. Database Engine Specification & Selection Rationale

### Which Database is Used?
The system utilizes **PostgreSQL 16** (specifically PostgreSQL 16 Alpine containerized via Docker). The object-relational mapping and database access layer are powered by **Prisma ORM** (`prisma-client-js`).

### Why PostgreSQL was Chosen for Safed Sheri (Architectural Rationale)

1. **ACID Transaction Compliance & Financial Integrity**:
   Event ticketing systems require absolute data integrity. Operations such as registration creation, payment processing (online webhooks or cashiers), ticket allocation, and pass status updates must execute inside isolated database transactions (`prisma.$transaction`). PostgreSQL guarantees full ACID compliance, preventing partial writes, lost updates, or duplicate pass generation under concurrent traffic.

2. **Exact Financial Precision (`@db.Decimal(10, 2)`)**:
   Financial values (`amount`, `amountDue`, `singlePrice`, `couplePrice`, `price`) require exact decimal math. Floating-point numbers used in some NoSQL databases can introduce subtle rounding errors. PostgreSQL's native `DECIMAL` data type guarantees precision down to the cent/paisa.

3. **Strict Schema Enforcement & Typesafe Enums**:
   Safed Sheri enforces strict state machines for passes (`SUBMITTED` → `APPROVED` → `PAYMENT_CONFIRMED` → `PASS_ISSUED`). PostgreSQL enums (`Role`, `PassType`, `RegistrationStatus`, `PaymentMethod`, `PaymentStatus`, `CredentialStatus`, `ScanResult`, `VerificationMethod`) strictly enforce allowed values at the database level, avoiding illegal application states.

4. **Complex Relational Graph & Multi-Table Joins**:
   The system handles interconnected entity relationships:
   - A `Registration` bridges `Event`, `PricingPhase`, `User` (createdBy/reviewedBy), `Gazebo`, `Attendee` (via `RegistrationAttendee` junction table), `Payment` records, and `Credential` records.
   - PostgreSQL handles complex relational queries and cascading operations (`onDelete: Cascade`) with high efficiency.

5. **Sub-Millisecond Gate Entry Lookup Performance (B-Tree Indexing)**:
   During peak event hours, entry gate scanners handle thousands of QR code scans per hour. Key lookup columns (`secureToken`, `passCode`, `aadhaarHmac`, `phone`, `receiptNumber`, `registrationNumber`, `status`) are explicitly indexed with B-Tree indexes, enabling sub-millisecond query response times at the gate.

6. **Privacy Standard & Duplicate Prevention (`aadhaarHmac` Unique Constraints)**:
   To comply with UIDAI Aadhaar privacy guidelines, raw Aadhaar numbers are never stored unencrypted. Instead:
   - An **HMAC-SHA256 hash** (`aadhaarHmac`) is generated with a secret key and stored with a `@unique` constraint in PostgreSQL.
   - This allows PostgreSQL to instantly block duplicate registrations using the same Aadhaar card without needing to decrypt sensitive identity data.

---

## 3. Database Connection Architecture & Execution Flow

```
+------------------------+        +------------------------+        +------------------------+
|   Next.js / Client     |  HTTP  |       NestJS API       | Prisma |      PostgreSQL 16     |
|   (apps/admin)         | ------>|       (apps/api)       | ------>|   (safedsheri-postgres)|
+------------------------+        +------------------------+        +------------------------+
                                              |
                                     [PrismaService]
                                   - connects on boot
                                   - runs schema patches
                                   - manages connection pool
```

### Step-by-Step Connection Lifecycle

1. **Environment Configuration**:
   The database connection string is defined in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/safedsheri?schema=public"
   ```

2. **Prisma Schema & Client Code Generation**:
   During build / deployment, `npx prisma generate` reads `prisma/schema.prisma` and compiles a strongly-typed Prisma Client tailored to the PostgreSQL schema into `node_modules/@prisma/client`.

3. **NestJS Dependency Injection & Lifecycle Initialization (`PrismaService`)**:
   `PrismaService` extends `PrismaClient` and is registered as a singleton provider inside NestJS `PrismaModule`:

   ```typescript
   // apps/api/src/prisma/prisma.service.ts
   @Injectable()
   export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
     private readonly logger = new Logger('PrismaService');

     async onModuleInit() {
       try {
         await this.$connect();
         this.logger.log('✅ Database connected successfully');
         // Executed runtime patches (e.g. couple pass price updates)
       } catch (error) {
         this.logger.error(`⚠️ Database connection failed: ${error.message}`);
       }
     }

     async onModuleDestroy() {
       await this.$disconnect();
     }
   }
   ```

4. **Connection Pooling & Docker Networking**:
   In production (`docker-compose.yml`), PostgreSQL runs as a dedicated service `safedsheri-postgres` on port `5432`. A Docker healthcheck verifies readiness (`pg_isready -U postgres -d safedsheri`) before the API container initializes.

---

## 4. Entity-Relationship (ER) Schema Diagram

```mermaid
erDiagram
    User ||--o{ AuditLog : "creates (actor)"
    User ||--o{ Entry : "verifies"
    User ||--o{ Payment : "collects"
    User ||--o{ Registration : "creates / reviews"
    User ||--o{ ScanAttempt : "scans"
    User ||--o{ BlockedUser : "blocks"

    Event ||--o{ Registration : "has"
    Event ||--o{ Entry : "hosts"
    Event ||--o{ ScanAttempt : "records"

    PricingPhase ||--o{ Registration : "defines price for"

    Attendee ||--o| AadhaarDocument : "has 1:1"
    Attendee ||--o{ RegistrationAttendee : "linked to"
    Attendee ||--o{ Credential : "owns"
    Attendee ||--o{ Entry : "enters via"

    Registration ||--o{ RegistrationAttendee : "contains attendees"
    Registration ||--o{ Payment : "has payments"
    Registration ||--o{ Credential : "generates passes"
    Registration ||--o{ Entry : "records entries"
    Registration }|--|| Gazebo : "assigned to"

    Credential ||--o{ Entry : "used for"
    Credential ||--o{ ScanAttempt : "scanned in"

    PaymentLocation ||--o{ Payment : "locates cash payment"
    Gazebo ||--o{ GazeboInquiry : "receives"
```

---

## 5. Complete Database Schema Models Breakdown

### 1. `User` (System Operators & Staff)
Handles administrative users, cashiers, entry verification officers, and attendees.
- **Fields**: `id` (UUID), `username` (Unique), `passwordHash`, `fullName`, `role` (`SUPER_ADMIN`, `TICKETING_FINANCE`, `ENTRY_VERIFICATION`, `ATTENDEE`), `isActive`, `createdAt`, `updatedAt`.
- **Indexes**: `[username]`, `[role]`.

### 2. `Event` (Event Details)
Represents the main event instance (e.g., Safed Sheri 2026).
- **Fields**: `id` (UUID), `name`, `eventDate`, `status` (`ACTIVE`), `createdAt`, `updatedAt`.
- **Indexes**: `[status]`, `[eventDate]`.

### 3. `PricingPhase` (Dynamic Pricing Tiers)
Manages dynamic pricing phases, countdown targets, urgency taglines, and pass visibility.
- **Fields**: `id`, `phaseName` (Unique), `singlePrice`, `couplePrice`, `nextSinglePrice`, `nextCouplePrice`, `showSinglePrice`, `showCouplePrice`, `showGazeboPrice`, `isCountdownActive`, `countdownTarget`, `urgencyTagline`, `hiddenPriceLabel`, `isActive`.
- **Indexes**: `[isActive]`.

### 4. `Attendee` (Registered Individuals)
Stores attendee demographic details and encrypted Aadhaar identity data.
- **Fields**: `id`, `fullName`, `phone`, `email`, `gender` (`FEMALE`, `MALE`, `OTHER`), `aadhaarHmac` (Unique HMAC-SHA256 digest for duplicate detection), `aadhaarMasked` (`XXXX XXXX 1234`), `aadhaarEncrypted` (AES-256-GCM ciphertext), `kidsAgeGroup`, `dob`.
- **Indexes**: `[phone]`, `[fullName]`, `[gender]`, `[aadhaarHmac]`.

### 5. `AadhaarDocument` (ID Verification Files)
Stores metadata for uploaded Aadhaar document scans (front and back) and OCR verification results.
- **Fields**: `id`, `attendeeId` (1:1 Unique), `storageKey`, `originalFilename`, `mimeType`, `sizeBytes`, `checksum`, `storageKeyBack`, `originalFilenameBack`, `mimeTypeBack`, `sizeBytesBack`, `checksumBack`, `ocrExtractedData`, `ocrMismatch` (Boolean).

### 6. `Registration` (Pass Registrations)
Core registration order grouping 1 or more attendees, pricing, status, and payment tracking.
- **Fields**: `id`, `registrationNumber` (Unique, e.g. `SS-2026-000810`), `eventId`, `pricingPhaseId`, `passType` (`SINGLE`, `COUPLE`, `GAZEBO`, `KIDS`), `status` (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `PAYMENT_PENDING`, `PAYMENT_CONFIRMED`, `PASS_ISSUED`, `REJECTED`, `CANCELLED`, `PAYMENT_FAILED`, `CASHIER_PENDING`), `amountDue`, `paymentLinkId` (Unique), `reviewNotes`, `reviewedById`, `reviewedAt`, `createdById`, `gazeboId`, `deletedAt`.
- **Indexes**: `[registrationNumber]`, `[status]`, `[passType]`, `[eventId]`, `[pricingPhaseId]`, `[paymentLinkId]`.

### 7. `RegistrationAttendee` (Junction Table)
Many-to-Many junction mapping `Registration` to `Attendee`, tracking primary attendee designation.
- **Fields**: `registrationId`, `attendeeId`, `isPrimary`, `status`, `reviewNotes`, `reviewedAt`.
- **Primary Key**: `[registrationId, attendeeId]`.

### 8. `PaymentLocation` (Cash Collection Points)
Tracks physical cashier desks / locations collecting cash or UPI QR payments on-site.
- **Fields**: `id`, `name`, `address`, `isActive`.

### 9. `Payment` (Financial Transactions)
Records payment transactions (Razorpay gateway, Cash, UPI QR, Custom Direct).
- **Fields**: `id`, `registrationId`, `paymentLocationId`, `collectedById`, `amount` (`Decimal(10,2)`), `method` (`ONLINE_GATEWAY`, `UPI_QR`, `CUSTOM_DIRECT`, `CASH`, `CARD`), `status` (`PENDING`, `CONFIRMED`, `FAILED`, `CANCELLED`, `REFUNDED`), `receiptNumber` (Unique), `provider`, `providerReference` (Razorpay Payment ID / Txn Ref), `paymentLinkId`, `notes`, `failureReason`.
- **Indexes**: `[receiptNumber]`, `[registrationId]`, `[providerReference]`, `[status]`, `[createdAt]`.

### 10. `Credential` (Digital QR Entry Passes)
Issued digital pass tokens for verified attendees to gain entry at the gate.
- **Fields**: `id`, `credentialNumber` (Unique), `passCode` (Unique short code), `registrationId`, `attendeeId`, `secureToken` (Cryptographic UUID string for QR Code), `status` (`ACTIVE`, `USED`, `CANCELLED`, `EXPIRED`), `issuedAt`, `usedAt`.
- **Indexes**: `[secureToken]`, `[passCode]`, `[credentialNumber]`, `[status]`, `[attendeeId]`.

### 11. `ScanAttempt` (Gate Entry Scan Audit Log)
Logs every scan attempt at entry gates, whether valid or rejected.
- **Fields**: `id`, `eventId`, `credentialId`, `scannedById`, `result` (`VALID`, `ALREADY_USED`, `CANCELLED`, `INVALID_TOKEN`, `WRONG_EVENT`, `PAYMENT_NOT_CONFIRMED`, `EXPIRED`), `rawTokenScanned`, `scannedAt`.
- **Indexes**: `[eventId]`, `[credentialId]`, `[scannedById]`, `[result]`, `[scannedAt]`.

### 12. `Entry` (Successful Gate Verification)
Records finalized venue entries.
- **Fields**: `id`, `eventId`, `attendeeId`, `registrationId`, `credentialId`, `entryType` (`QR`, `DIRECT`, `MANUAL`), `verificationMethod` (`QR_SCAN`, `CASHIER`, `MANUAL`), `verifiedById`, `notes`, `createdAt`.
- **Indexes**: `[eventId]`, `[attendeeId]`, `[registrationId]`, `[credentialId]`, `[verifiedById]`, `[createdAt]`.

### 13. `Gazebo` & `GazeboInquiry` (VIP Lounges)
Manages VIP gazebo lounge availability, level tiers, pricing, inquiry leads, and custom invite tokens.

### 14. `SponsorInquiry` & `StallInquiry` (Commercial Inquiries)
Tracks corporate sponsorship and commercial food/retail stall leads.

### 15. `AuditLog` (System Audit Trail)
Tracks administrative actions performed by users for governance and fraud prevention.
- **Fields**: `id`, `actorId`, `action`, `targetEntity`, `targetId`, `payload` (JSON), `createdAt`.

### 16. `OtpVerification` & `OtpBypass` (Phone Auth & Whitelist)
Handles WhatsApp/SMS OTP codes and developer/testing bypass lists.

### 17. `BlockedUser` (Fraud & Security Blacklist)
Blacklists fraudulent phones or Aadhaar hashes from registering.

---

## 6. Key Data Security & Cryptographic Mechanisms

1. **Aadhaar Encryption (`AES-256-GCM`)**:
   - `AadhaarEncrypted` is generated using Node.js `crypto.createCipheriv('aes-256-gcm', key, iv)`.
   - Formatted as `iv:authTag:ciphertext`. Provides authenticated encryption preventing tampering.

2. **Aadhaar HMAC Hash (`SHA-256`)**:
   - Normalized phone/Aadhaar string is hashed via `crypto.createHmac('sha256', secret)`.
   - Stored in `aadhaarHmac` with `@unique` index for zero-knowledge duplicate lookup.

3. **Pass Secure Token Generation**:
   - High-entropy secure tokens embedded in QR codes prevent forgery.
   - Gate scanner verifies `secureToken` against `Credential` table in sub-milliseconds.

---

## 7. Administrative & Financial Maintenance Tools

The project contains diagnostic scripts in the root directory and `scratch/` folder used for live system maintenance:
- `check_db_totals.js`: Validates database total payments against Razorpay reports.
- `finance_debug.js`: Analyzes payment discrepancies and cashier pending records.
- `execute_sync.js`: Reconciles Razorpay captured payments with database records.
- `seed.ts` / `seed-admins.ts`: Seeds pricing phases, sample events, and super admin credentials (`superadmin` / default pass).

---

## 8. Summary of Database Architectural Decisions

| Requirement | Solution Implemented | Technical Benefit |
| :--- | :--- | :--- |
| **High Concurrency Ticketing** | PostgreSQL 16 + B-Tree Indexes | Handles thousands of concurrent QR scans & registrations with sub-millisecond lookup latency. |
| **Financial Accuracy** | `@db.Decimal(10, 2)` | Eliminates IEEE 754 floating-point precision loss in Razorpay & cash payment accounting. |
| **Double Booking / Duplicate Regs** | `aadhaarHmac` + `@unique` constraint | Prevents multiple registrations using the same Aadhaar card without exposing raw Aadhaar data. |
| **UIDAI Compliance & Security** | AES-256-GCM + Masked Strings | Sensitive Aadhaar identity details are encrypted at rest with authenticated tags. |
| **State Consistency** | PostgreSQL Enums & Prisma Transactions | Guarantees strict status workflow transitions (`SUBMITTED` -> `APPROVED` -> `PAYMENT_CONFIRMED` -> `PASS_ISSUED`). |
