# Digital Attendee Profile — Safed Sheri

## 1. Profile Concept

The platform maintains a digital attendee profile indexed primary by the user's **WhatsApp-verified phone number**. 

To adhere to privacy-by-design standards, personal data collection is strictly limited to data required for identity verification, ticketing, and event security.

## 2. Profile Data Fields

| Attribute | Data Type | Mandatory | Purpose |
| :--- | :--- | :---: | :--- |
| `id` | UUID | YES | Internal Primary Key |
| `phone_number` | String (E.164) | YES | Primary identity & WhatsApp contact |
| `full_name` | String | YES | Attendee identity verification |
| `whatsapp_verified` | Boolean | YES | OTP verification status |
| `verified_at` | Timestamp | YES | Timestamp of OTP confirmation |
| `face_auth_ref` | String / Vector | OPEN DECISION #11 | Reference for gate face verification |
| `created_at` | Timestamp | YES | Account registration timestamp |
| `updated_at` | Timestamp | YES | Profile update timestamp |

## 3. Associated Profile Data

An Attendee Profile acts as the parent container for:
* **Booking History:** Array of all reservations associated with the phone number.
* **Active Passes:** List of currently valid digital passes with QR tokens.
* **Entry Records:** Gate entry timestamps and status logs.

---
*Document Part of Safed Sheri Master Specifications.*
