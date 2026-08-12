# Open Architectural & Product Decisions — Safed Sheri

> [!IMPORTANT]
> The following 30 decisions must be explicitly resolved before commencing production software development.

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
*Document Part of Safed Sheri Master Specifications.*
