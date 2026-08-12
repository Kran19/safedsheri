# System Overview — Safed Sheri

## 1. High-Level Technical Architecture

```text
                                 ┌─────────────────────────────────┐
                                 │       CLIENT INTERFACES         │
                                 └────────────────┬────────────────┘
                                                  │
         ┌────────────────────────────────────────┼────────────────────────────────────────┐
         ▼                                        ▼                                        ▼
┌──────────────────┐                     ┌──────────────────┐                     ┌──────────────────┐
│  Public Web App  │                     │  Finance Counter │                     │  Gate Scanner    │
│  (Next.js / 3D)  │                     │  (Responsive PWA)│                     │  (Mobile Camera) │
└────────┬─────────┘                     └────────┬─────────┘                     └────────┬─────────┘
         │                                        │                                        │
         └────────────────────────────────────────┼────────────────────────────────────────┘
                                                  │ (HTTPS / REST & GraphQL / WSS)
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │       BACKEND API GATEWAY       │
                                 │   (Node.js / Express / NestJS)  │
                                 └────────────────┬────────────────┘
                                                  │
         ┌────────────────────────────────────────┼────────────────────────────────────────┐
         ▼                                        ▼                                        ▼
┌──────────────────┐                     ┌──────────────────┐                     ┌──────────────────┐
│ Primary Database │                     │ Cache / Sessions │                     │ External Services│
│ (PostgreSQL/MySQL│                     │     (Redis)      │                     │ (WhatsApp/Face)  │
└──────────────────┘                     └──────────────────┘                     └──────────────────┘
```

## 2. Technical Stack Recommendation (**OPEN DECISION #27**)

* **Frontend Public:** Next.js 14 (App Router), React, Three.js / React Three Fiber, Framer Motion, Vanilla CSS / Tailwind CSS.
* **Frontend Operational:** Next.js PWA / React Native Mobile Web, HTML5 Camera Scanner (ZXing / html5-qrcode).
* **Backend Framework:** Node.js (TypeScript) / Express or NestJS.
* **Database & ORM:** PostgreSQL 16 with Prisma / Drizzle ORM.
* **In-Memory Store:** Redis 7 (OTP caching, rate-limiting, live session locks).
* **Messaging Queue:** BullMQ / RabbitMQ for async WhatsApp message dispatches.

---
*Document Part of Safed Sheri Master Specifications.*
