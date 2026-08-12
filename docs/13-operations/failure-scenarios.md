# Failure Scenarios & Emergency Protocols — Safed Sheri

## 1. Risk Matrix & Mitigations

| Failure Scenario | Risk Level | System & Operational Mitigation |
| :--- | :---: | :--- |
| **Cellular Network Failure at Gate** | HIGH | Local gate mesh Wi-Fi network automatically routes scan requests to on-site local edge cache server. |
| **WhatsApp Gateway Outage** | MEDIUM | Fallback to secondary SMS gateway for OTP and booking confirmation delivery. |
| **Power Failure at Cash Counter** | MEDIUM | Counter Executives operate battery-powered mobile tablets with 8-hour backup capacity. |
| **Duplicate QR Scan Attempt** | HIGH | Backend atomic locking (`SELECT FOR UPDATE`) rejects second scan instantly with `PASS_ALREADY_USED` alert. |
| **White Dress Code Gate Dispute** | HIGH | Officer refers attendee to Supervisor Desk. System logs "Dress Code Rejection" with mandatory officer notes. |
| **Scanner Hardware Failure** | LOW | Spare scanner devices pre-configured with active officer sessions available at supervisor station. |

---
*Document Part of Safed Sheri Master Specifications.*
