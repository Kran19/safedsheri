# Security Requirements — Safed Sheri

## 1. Core Security Mandates

1. **Zero Client Trust:** Frontend applications (Public Web, Cash Counter PWA, Scanner App) are strictly untrusted clients. All business rules, payment status updates, and pass validations are performed exclusively behind authenticated server APIs.
2. **Cryptographic QR Nonces:** Pass QR codes store non-deterministic cryptographic tokens or signed nonces. Plain identifiers (e.g. `pass_id=123`) are forbidden.
3. **Role-Based Token Isolation:** JWTs issued to Entry Verification Officers grant zero access to financial or administrative endpoints.
4. **OTP Hardening:** WhatsApp OTP codes expire after 5 minutes and allow a maximum of 3 failed verification attempts before invalidation. Rate limiting prevents SMS/WhatsApp flood attacks.

---
*Document Part of Safed Sheri Master Specifications.*
