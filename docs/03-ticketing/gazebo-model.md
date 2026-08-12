# Gazebo Model — Safed Sheri

## 1. Gazebo Tier Architecture

Gazebos represent ultra-exclusive private enclosures overlooking the Garba venue. All Gazebo tiers launch simultaneously with an absolute inventory ceiling of **12 gazebos** (4 units per level).

```text
+----------------------------------------------------------------+
|                         GAZEBO LAYOUT                          |
|----------------------------------------------------------------|
|  LEVEL 3 (4 Units)  │ Price: ₹1,25,000  │ Highest Tier Placement |
|---------------------+-------------------+----------------------|
|  LEVEL 2 (4 Units)  │ Price: ₹1,00,000  │ Mid Tier Placement   |
|---------------------+-------------------+----------------------|
|  LEVEL 1 (4 Units)  │ Price: ₹85,000    │ Level Tier Placement |
+----------------------------------------------------------------+
```

## 2. Gazebo Pricing & Inventory Matrix

| Level / Category | Price per Gazebo | Quantity | Total Allocation |
| :--- | :---: | :---: | :---: |
| **Level 1** | ₹85,000 | 4 | 4 Gazebos |
| **Level 2** | ₹1,00,000 | 4 | 4 Gazebos |
| **Level 3** | ₹1,25,000 | 4 | 4 Gazebos |
| **TOTAL INVENTORY** | — | **12** | **12 Gazebos** |

## 3. Gazebo Rules

1. Gazebo inventory is tracked completely independently from standard ticket inventory.
2. Once a Gazebo level reaches 4 booked/reserved units, the system must immediately mark that level as `SOLD OUT`.
3. Gazebos are subject to the same physical cash payment verification model as standard tickets.

---
*Document Part of Safed Sheri Master Specifications.*
