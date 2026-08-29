# Razorpay vs Database Discrepancy Report

**Razorpay Actual in DB:** ₹1,40,900
**Razorpay Total in Dump:** ₹1,42,702

The difference exists because the Database is **MISSING** some payments that are in the Razorpay dump, while simultaneously having **EXTRA** payments that are NOT in the Razorpay dump.

## 1. Missing from Database (Successful in Razorpay, but webhook failed)
These payments exist in your Razorpay dashboard, but are NOT in the Database's "Razorpay Actual".

| Razorpay ID | Amount (₹) |
|---|---|
| pay_TVUnwzB765LPOn | ₹3500 |
| pay_TVUdPBRowrNmJO | ₹3500 |
| pay_TVUbMSkjjNUaaV | ₹100 |
| pay_TVUZqUr4jNr4EE | ₹3500 |
| pay_TVUOht5EMv9uhH | ₹3500 |
| pay_TVULjzBLLlccqH | ₹6400 |
| pay_TU5EeryVGpd1A0 | ₹6500 |
| pay_TU56i5zRoQzNxa | ₹1 |
**Total Missing from DB:** ₹27001

## 2. Extra in Database (In DB, but not in Razorpay Dump)
These payments are currently counted in the **₹1,40,900** DB total, but they are MISSING from the text file dump you provided. This could be because they are newer payments, or they were manually overridden to look like Razorpay payments.

| Razorpay ID / Ref | Attendee Name | Amount (₹) |
|---|---|---|
| pay_TVVy2eUJaa6gua | Janki Darshan Faldu | ₹6500 |
| pay_TVW2bEdzz0Egu1 | Aanya Darshan Faldu | ₹1200 |
| pay_TVW4VJv6EalBXI | Devanshi Manan Bhanderi | ₹3500 |
| pay_TVWJE0CdTLfDbN | Anushka Bhaveshbhai Dodiya | ₹3500 |
| pay_TVWKTFs5X24KvL |  Nitaben Bhaveshbhai Dodiya  | ₹3500 |
| pay_TVWMdH2UpUu3t2 | Devanshi Kamleshbhai Basida | ₹3500 |
| pay_ASTHA_FIXED_RZP_ID | Astha jeal desai | ₹3500 |
**Total Extra in DB:** ₹25200

## Summary Math
`[Razorpay Dump] - [Missing from DB] + [Extra in DB] = [DB Razorpay Actual]`
`1,42,702 - 27001 + 25200 = 140901`

