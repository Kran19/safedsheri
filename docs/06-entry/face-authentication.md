# Face Authentication Integration — Safed Sheri

## 1. Role of Face Authentication

Face authentication serves as the secondary verification layer enforcing pass non-transferability.

## 2. Integration Modes

Depending on technical resolution (**OPEN DECISION #10 & #11**), face verification will follow one of two models:

* **Model A: Automated Biometric Matching**
  * Scanner camera captures live face image → System performs 1:1 facial vector embedding comparison against registered reference image → Match score calculated (>95% threshold grants clearance).
* **Model B: Officer Visual Matching**
  * Scanning valid QR fetches encrypted reference photo of attendee onto officer screen → Officer performs visual verification against physical attendee → Officer clicks "Identity Match Confirmed".

## 3. Security & Consent Safeguards

* Biometric data vectors must be encrypted in transit and at rest.
* Attendees accept explicit face verification consent during initial booking.
* All biometric reference data is automatically purged within 30 days post-event.

---
*Document Part of Safed Sheri Master Specifications.*
