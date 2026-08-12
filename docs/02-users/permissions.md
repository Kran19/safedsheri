# Permission Matrix — Safed Sheri

## 1. Role-Based Access Control (RBAC) Architecture

To guarantee financial integrity and gate security, all backend API endpoints evaluate caller permissions against an explicit RBAC matrix.

## 2. Complete Permission Matrix

| Capability / Action | Attendee | Ticketing & Finance Executive | Entry Verification Officer | Super Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **View Public Event Website** | YES | YES | YES | YES |
| **Create Pass Reservation** | YES | YES (Assisted) | NO | YES |
| **Verify Phone (WhatsApp OTP)** | YES | N/A | N/A | N/A |
| **View Own Booking & Passes** | YES | YES (Assigned Counter) | MINIMAL | YES |
| **Search All Pending Bookings** | NO | YES | NO | YES |
| **Record Physical Cash Received** | NO | YES | NO | YES |
| **Verify Payment & Activate Pass** | NO | YES | NO | YES |
| **Access Digital Pass QR** | OWN ONLY | OPERATIONAL VIEW | MINIMAL VIEW | YES |
| **Scan Pass QR at Gate** | NO | OPTIONAL | YES | YES |
| **View Face Auth Match Image** | NO | NO | YES | YES |
| **Approve / Deny Gate Entry** | NO | NO | YES (System-Guided) | YES (With Override) |
| **Manage Pricing Phases** | NO | NO | NO | YES |
| **Manage Gazebo Allocations** | NO | NO | NO | YES |
| **Manage Sponsor / Stall Leads** | NO | NO | NO | YES |
| **Manage Staff Accounts** | NO | NO | NO | YES |
| **Access Financial Reconciliation** | NO | LIMITED (Own Counter) | NO | YES (Full) |
| **Access System Audit Logs** | NO | NO | NO | YES |

---
*Document Part of Safed Sheri Master Specifications.*
