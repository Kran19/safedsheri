# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created `apps/api/src/utils/whatsapp.service.ts` to integrate Zaple v2 API for template messaging with automatic country code separation and phone sanitization.
- Implemented `POST /credentials/wallet-otp/send` and `POST /credentials/wallet-otp/verify` endpoints for secure "My Pass" queries (resolving linked mobile numbers from Aadhaar or phone searches).
- Added `verifyOtpToken` validation inside `AuthService` to secure public pass lookups.
- Implemented glassmorphism WhatsApp OTP verification Modal UI in `LandingPageClient.tsx` with a modern 6-box auto-focusing split digit input design (and removed the text badge pill from the top).
- Replaced ugly browser alert dialogues with a clean 1-line inline form error notification under the My Pass search form.
- Added Zaple API credentials variables to `.env` and `.env.example`.
- Added `OtpBypass` database model and management endpoints (`GET /users/otp-bypass`, `POST /users/otp-bypass`, `DELETE /users/otp-bypass/:phone`) for the Super Admin to exempt individual phone numbers from WhatsApp OTP verification.
- Added public check endpoint `GET /auth/otp-bypass-check/:phone` to let the frontend verify if a number is exempted.
- Added "OTP Bypass List" tab and settings form to the Admin Dashboard for easy addition/removal of exempted numbers.
- Updated registration and wallet search flows in the landing page client to bypass the OTP modal if the phone number is exempted.
- Added `inviteToken` field to `Gazebo` model to enable self-service VIP guest registration.
- Implemented staff endpoints `POST /gazebos/:id/invite-link` and `DELETE /gazebos/:id/invite-link` to generate/revoke guest invite tokens.
- Implemented public endpoints `GET /auth/gazebo-invite/:token` and `POST /auth/gazebo-invite/:token/submit` for secure VIP guest detail collection and verification.
- Created premium public `/gazebo-invite/[token]/page.tsx` client portal for guests to submit details, upload Aadhaar cards (with OCR), and verify using WhatsApp OTP.

### Changed
- Replaced the old Twilio OTP dispatch logic with Zaple API inside `AuthService.sendWhatsAppOtp`.
- Updated `GET /credentials/my-pass` and `POST /credentials/my-pass` endpoints to require valid `otpToken` verification.
- Modified public registration submission to strictly require verified `otpToken` matching the primary attendee's phone.
- Updated Gazebo seeding loop to initialize 14 physical gazebos instead of 12.
- Updated Admin Panel headers, descriptions, and counter badges to dynamically support 14 gazebos.
- Enabled redirect logic in `/login/page.tsx` on page mount so authenticated users cannot access the login form using the browser's back button.

### Fixed
- Fixed phone query validation bug in `CredentialsService.findMyPass` where country code prefixes (e.g. `91` or `+91`) on verified tokens caused mismatch failures against 10-digit search queries.

