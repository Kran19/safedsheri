# SAFED SHERI 2026 — OPEN DECISIONS LOG

This document explicitly tracks open architectural, product, and operational decisions as required by the Safed Sheri Master Directive.

---

## 1. WhatsApp OTP & Messaging Gateway Provider
- **Context**: WhatsApp is the primary customer communication channel for OTP verification, booking confirmations, payment counter directions, and digital pass delivery.
- **Options**:
  - Twilio WhatsApp Business API
  - Meta Cloud API (Direct)
  - Interakt / Wati / MessageBird
- **Status**: **OPEN DECISION** (Defaults to mock OTP for prototype development until production provider credential is set). - gonna use our personal develop software not any third party

---

## 2. Multi-Person Booking QR Credential Architecture
- **Context**: Couple passes (₹6,500) and Group/Gazebo bookings include multiple attendees under one booking reference.
- **Options**:
  - **Option A (Recommended)**: Generate 1 unique high-entropy QR code (`ss_qr_<hex>`) per individual attendee. -> option A is final
  - **Option B**: Generate 1 master QR code per booking with multi-scan counter.
- **Status**: **OPEN DECISION** (Option A implemented in current database model for individual gate scanning accuracy).

---

## 3. Face Authentication & Biometric Data Retention Policy
- **Context**: System directive mentions optional Face Authentication at venue entry.
- **Options**:
  - On-device visual verification by Gate Security Officer.
  - AWS Rekognition / Azure Face API.
- **Compliance Rule**: Full consent model required; zero raw biometric images stored in PostgreSQL. -> Not gonna use biometrics at all.
- **Status**: **OPEN DECISION** (Gate Security interface currently optimized for sub-second QR scanning).

---

## 4. Online Payment Gateway Integration vs. Physical Cash Counters
- **Context**: Current business model relies on physical offline cash counters (`BOOKING PENDING` -> `CASHIER CONFIRMS`).
- **Options**:
  - Retain pure physical cash counter model for 2026. -> Keeping this decision as it is. - No online payment gateway integration for 2026. Cash is king.
  - Add Razorpay / PhonePe / Cashfree online payment gateway integration for direct online pass activation.
- **Status**: **OPEN DECISION** (Physical cash counter workflow implemented and fully containerized).

---

## 5. Offline Gate Backup & Network Disruption Resilience
- **Context**: High-density event day network congestion at venue gates on 9 October 2026.
- **Options**:
  - Local edge server running on venue Wi-Fi network. -> keeping it on mobile 5g 
  - SQLite / IndexedDB sync on scanner devices.
- **Status**: **OPEN DECISION** (PostgreSQL transactional row-level locking implemented for sub-5ms scan response over local network).
