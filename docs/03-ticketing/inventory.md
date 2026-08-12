# Inventory Management — Safed Sheri

## 1. Inventory Principles

1. **Controlled Allocations:** Standard tickets and Gazebo inventory represent finite, controlled assets.
2. **Concurrency Locking:** To prevent overselling during high-traffic booking windows, database writes for ticket reservations must utilize row-level locking (`SELECT FOR UPDATE`) or atomic inventory decrements.
3. **Independent Pools:** Gazebo Level 1, Level 2, Level 3, Single Passes, and Couple Passes operate in separate inventory pools.

## 2. Reservation Expiry & Holding Logic

* When a booking is created (`PAYMENT_PENDING`), the requested inventory is temporarily locked in a `RESERVED` pool.
* **OPEN DECISION #5:** If cash payment is not completed at an official counter within the designated timeout window (e.g., 24 hours), the system automatically releases the held inventory back to the active available pool.

---
*Document Part of Safed Sheri Master Specifications.*
