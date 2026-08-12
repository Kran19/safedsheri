# SAFED SHERI 2026 — DIGITAL EXPERIENCE IMPLEMENTATION PLAN

## Overview
This document outlines the phased roadmap for building the **Safed Sheri 2026 Single-Page Immersive Digital Experience**, integrating the 330-frame cinematic video spine, White Tigress visual theme, Garba motion language, and operational pass booking system into one seamless web product.

---

## Phase Roadmap

### PHASE 1 — Creative Foundation & Visual Design System
- Establish color tokens: Charcoal (#0F172A), Pure White (#FFFFFF), Ivory (#FAF8F5), Warm Gold (#D4AF37), Amber (#F59E0B).
- Integrate Devanagari & English editorial typography (Google Fonts Inter + Playfair Display / Cinzel).
- Define particle lighting, gold line assets, and White Tigress artwork motifs.

### PHASE 2 — Single-Page Shell & Navigation
- Build root single-page layout structure (`apps/admin/app/experience/page.tsx` or `apps/public`).
- Create minimal persistent navigation header (*Safed Sheri • Experience • Passes • My Pass • Partner*).
- Implement Quick Access Mode ("MY PASS") allowing returning attendees to bypass cinematic sequence instantly.

### PHASE 3 — 330-Frame Canvas Scroll Engine
- Build high-performance HTML5 Canvas image sequence renderer.
- Implement progressive preloading for 330 frames (`001.png` to `330.png`) from `image sectionwise/finalstoriesimages/`.
- Bind scroll progress smoothly to frame sequence using `requestAnimationFrame` and GPU hardware acceleration.

### PHASE 4 — Motion & Garba Interaction System
- Implement custom circular gold cursor with crossed Dandiya micro-interaction on hover/click.
- Add optional audio manager for ghungroo & Dandiya percussion sound effects with global Mute toggle.
- Create circular mask transitions between major narrative chapters.

### PHASE 5 — Spatial Ticketing & Gazebo Experience
- Build Early Bird (₹3,500 Single / ₹6,500 Couple), Phase 1, Phase 2 ticket selector.
- Build spatial 3-Level Gazebo interactive map with glowing venue nodes:
  - Level 1 (₹85,000)
  - Level 2 (₹1,00,000)
  - Level 3 (₹1,25,000)

### PHASE 6 — Registration & WhatsApp OTP Modal
- Single-page overlay form collecting attendee details (`fullName`, `phone`, `email`, `aadhaarNumber`).
- Step-by-step registration flow with WhatsApp OTP verification simulation/integration.
- Displays clear **BOOKING CREATED • PAYMENT PENDING** status and physical cash counter directions.

### PHASE 7 — My Pass & Digital Wallet
- Slide-over digital pass wallet displaying active QR code (`ss_qr_<hex>`), attendee profile, booking reference, and non-transferability warnings.
- Mandatory White Dress Code compulsory visual reminder.

### PHASE 8 — Sponsor & Stall Application Overlays
- "BECOME A SPONSOR" single-page form overlay.
- "APPLY FOR A STALL" single-page form overlay with success feedback (*"Your message has entered the night."*).

### PHASE 9 — Operational Backend Integration
- Connect registration and booking forms to NestJS REST API (`/api/v1/registrations`, `/api/v1/payments`).
- Preserve role-based access control for Cashier and Security terminals.

### PHASE 10 — Performance & Image Sequence Optimization
- Generate WebP/AVIF lightweight variants of the 330 frames.
- Implement adaptive mobile frame-skipping (rendering every 2nd or 3rd frame on mobile viewports for smooth 60 FPS performance).

### PHASE 11 — Accessibility & Reduced Motion
- Detect `prefers-reduced-motion` media query and provide static image fallback sequence.
- Full ARIA labels, semantic keyboard navigation, and visible focus rings.

### PHASE 12 — QA & Cross-Browser Verification
- Test across Chrome, Safari, Firefox, iOS Mobile Safari, and Android Chrome.
- Validate sub-second page responsiveness and zero layout cumulative shift (CLS).

### PHASE 13 — Event-Day Readiness (9 October 2026)
- Validate end-to-end flow: **Public Booking -> Cashier Confirmation -> Pass Issuance -> Security Gate QR Scan -> Venue Entry**.
