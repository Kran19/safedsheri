# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created `apps/api/src/utils/whatsapp.service.ts` to integrate Zaple v2 API for template messaging with automatic country code separation and phone sanitization.
- Implemented `POST /credentials/wallet-otp/send` and `POST /credentials/wallet-otp/verify` endpoints for secure "My Pass" queries (resolving linked mobile numbers from Aadhaar or phone searches).
- Added `verifyOtpToken` validation inside `AuthService` to secure public pass lookups.
- Implemented glassmorphism WhatsApp OTP verification Modal UI in `LandingPageClient.tsx` with a modern 6-box auto-focusing split digit input design.
- Replaced ugly browser alert dialogues with a clean 1-line inline form error notification under the My Pass search form.
- Added Zaple API credentials variables to `.env` and `.env.example`.

### Changed
- Replaced the old Twilio OTP dispatch logic with Zaple API inside `AuthService.sendWhatsAppOtp`.
- Updated `GET /credentials/my-pass` and `POST /credentials/my-pass` endpoints to require valid `otpToken` verification.
- Modified public registration submission to strictly require verified `otpToken` matching the primary attendee's phone.

### Fixed
- Fixed phone query validation bug in `CredentialsService.findMyPass` where country code prefixes (e.g. `91` or `+91`) on verified tokens caused mismatch failures against 10-digit search queries.

