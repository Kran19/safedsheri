# Passwordless WhatsApp OTP Flow — Safed Sheri

## 1. Authentication Workflow

```text
[ User Enters Phone Number ] ──► [ Frontend Calls POST /api/v1/auth/request-otp ]
                                             │
                                             ▼
                                [ System Generates 6-Digit OTP ]
                                [ Hashes OTP & Stores in Redis (TTL: 5m) ]
                                             │
                                             ▼
                                [ Dispatches WhatsApp OTP Message ]
                                             │
                                             ▼
[ User Submits OTP Code ]   ──► [ Frontend Calls POST /api/v1/auth/verify-otp ]
                                             │
                                             ▼
                                [ System Validates Code & Returns Session JWT ]
```

## 2. Security & Rate Limiting Guidelines

* OTP code consists of 6 cryptographically random digits.
* OTP expires strictly after **5 minutes**.
* Rate Limiting: Maximum 3 OTP dispatch requests per 5 minutes per phone number / IP address.
* Maximum 3 verification attempts allowed before invalidating OTP.

---
*Document Part of Safed Sheri Master Specifications.*
