# Pricing Phases — Safed Sheri

## 1. Dynamic Pricing Strategy

Ticket pricing for Safed Sheri is structured across three chronological phases: **Early Bird**, **Phase 1**, and **Phase 2**. 

Prices are fully configurable by the Super Administrator and are managed dynamically via backend database configuration.

## 2. Canonical Pricing Schedule

| Phase Name | Single Pass Price | Couple Pass Price | Status Management |
| :--- | :---: | :---: | :--- |
| **Early Bird** | ₹3,500 | ₹6,500 | Configurable start/end date or inventory trigger |
| **Phase 1** | ₹4,000 | ₹7,500 | Activates post Early Bird completion |
| **Phase 2** | ₹4,500 | ₹9,000 | Final pricing phase prior to event night |

## 3. Phase Configuration Parameters

Each pricing phase entity supports:
* `phase_name`: Descriptive name.
* `single_price`: Monetary price for single pass.
* `couple_price`: Monetary price for couple pass.
* `start_timestamp`: Scheduled activation time.
* `end_timestamp`: Scheduled deactivation time.
* `inventory_cap`: Optional inventory limit for phase.
* `is_active`: Boolean flag indicating current live phase.
* `display_priority`: Sort order for public display.

---
*Document Part of Safed Sheri Master Specifications.*
