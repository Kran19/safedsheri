# Business Rules — Safed Sheri

## 1. Canonical Policy Definitions

The following business policies are hard rules across the Safed Sheri ecosystem and must be rendered verbatim across all touchpoints (Website, Booking Flow, WhatsApp Notifications, Passes, Terms & Conditions, and Gate Signage).

### Policy A: Mandatory White Dress Code
> **"White dress code is compulsory."**  
> **"No entry will be permitted without adhering to the mandatory white dress code. This policy applies to all attendees, including children."**

* **Scope:** Universal. Applies to Single ticket holders, Couple ticket holders, Gazebo guests, VIPs, adults, children, and event staff.
* **Enforcement:** Mandatory physical inspection by Entry Verification Officers prior to granting final gate access.

### Policy B: Strict Non-Transferability
> **"Passes are strictly non-transferable and cannot be forwarded or shared."**

* **Enforcement:** Digital passes require live server-side QR authentication paired with photo/face identity matching at the gate. Forwarded screenshots or unauthenticated QR code captures are denied.

### Policy C: Strict Refund Policy
> **"No refunds will be issued unless the event is cancelled by the organisers."**

* **Scope:** Applies to all completed cash transactions, reserved tickets, and gazebo allocations.

---

## 2. Pass Validation Conditions

Entry into the venue requires **ALL 9 verification conditions** to be simultaneously satisfied:

1. A valid pass record exists in the system database.
2. The pass originates from the authorized Safed Sheri web app / official WhatsApp channel.
3. The pass status is `ACTIVATED` / `READY_FOR_ENTRY`.
4. Payment status is `VERIFIED` by an authorized Ticketing & Finance Executive.
5. The scanned QR token is authentic and cryptographically valid.
6. The pass has NOT been previously scanned or used (`is_used == false`).
7. Attendee identity verification succeeds.
8. Face authentication check passes.
9. Attendee strictly complies with the mandatory white dress code.

---

## 3. Financial & Operational Rules

1. **Booking vs Payment Separation:** A created online booking reservation does NOT grant pass activation. Passes remain `PENDING` until cash is collected and verified at an official counter.
2. **Controlled Inventory:** Ticket phases and gazebo levels have hard inventory ceilings. System locking prevents overselling during high concurrency.
3. **Audit Trail:** Every payment status change, pass activation, entry approval, or manual admin override must log an immutable audit record.

---
*Document Part of Safed Sheri Master Specifications.*
