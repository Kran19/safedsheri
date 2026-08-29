# Razorpay vs Database Mock Analysis

**NEW Razorpay Dump Total (Captured Only):** ₹167902
**Total Captured Transactions in Dump:** 42

## Analysis of Missing/Pending DB Records
The following users have "Captured" payments in your new Razorpay dump. We checked the Database to see if they are missing or still pending.

| Razorpay ID | Phone Number | Dump Amount (₹) | Database Status |
|---|---|---|---|
| pay_TVWK9vmJDhOlzR | +91 9820 722521 | ₹3500 | ❌ **USER EXISTS, BUT NO PAYMENT RECORD** (Astha jeal desai) |
| pay_TVUnwzB765LPOn | +91 9426 936148 | ₹3500 | ❌ **COMPLETELY MISSING FROM DB** |
| pay_TVUdPBRowrNmJO | +91 9723 611790 | ₹100 | 🛠️ **MANUAL OVERRIDE in DB** (Richa mashru) |
| pay_TVUbMSkjjNUaaV | +91 8780 230805 | ₹3500 | 🛠️ **MANUAL OVERRIDE in DB** (Kakadiya Devangi Hiren) |
| pay_TVUZqUr4jNr4EE | +91 8780 230805 | ₹3500 | 🛠️ **MANUAL OVERRIDE in DB** (Kakadiya Devangi Hiren) |
| pay_TVUOht5EMv9uhH | +91 9723 611790 | ₹6400 | 🛠️ **MANUAL OVERRIDE in DB** (Richa mashru) |
| pay_TVULjzBLLlccqH | +91 8460 609656 | ₹6500 | ❌ **COMPLETELY MISSING FROM DB** |
| pay_TUlyY9BEEOrQgK | +91 9879 572880 | ₹3500 | 🛠️ **MANUAL OVERRIDE in DB** (JALPA KARSHAN ADROJA HE as) |
| pay_TU5EeryVGpd1A0 | +91 6359 120081 | ₹1 | ❌ **USER EXISTS, BUT NO PAYMENT RECORD** (Fatma) |
| pay_TU56i5zRoQzNxa | +91 7265 098626 | ₹1 | ❌ **COMPLETELY MISSING FROM DB** |

**Summary:**
- Found **5** users who paid in Razorpay but are currently marked as PENDING or ADMIN-MANUAL in the DB.
- Found **5** payments in Razorpay that don't have matching user records in the DB at all.
