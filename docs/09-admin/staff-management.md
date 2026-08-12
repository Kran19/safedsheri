# Staff Management — Safed Sheri

## 1. Role Provisioning & Security

Super Administrators create, update, and deactivate staff accounts for operational personnel.

* **Account Types:**
  1. `FINANCE_EXECUTIVE`: Assigned to cash counters. Permissions scoped strictly to searching pending bookings, entering received cash amounts, and confirming payment verification.
  2. `ENTRY_OFFICER`: Assigned to gate scanner devices. Permissions scoped strictly to scanning QRs, inspecting face images/match statuses, and approving/denying gate entry.

## 2. Security Mandates

* Staff accounts require strong password policies + Multi-Factor Authentication (MFA).
* Staff tokens expire after **12 hours** to enforce shift renewal.
* Instant deactivation capability in case of device loss or compromise.

---
*Document Part of Safed Sheri Master Specifications.*
