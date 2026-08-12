# Entity Specifications — Safed Sheri

## 1. Primary Database Entities

### 1. `Events`
* `id` (PK, UUID)
* `name` (String, e.g. "Safed Sheri 2026")
* `year` (Integer, e.g. 2026)
* `venue` (String)
* `event_date` (Timestamp)
* `status` (Enum: `UPCOMING`, `LIVE`, `COMPLETED`, `CANCELLED`)

### 2. `TicketPhases`
* `id` (PK, UUID)
* `event_id` (FK -> `Events.id`)
* `phase_name` (String: `EARLY_BIRD`, `PHASE_1`, `PHASE_2`)
* `single_price` (Decimal)
* `couple_price` (Decimal)
* `start_time` (Timestamp)
* `end_time` (Timestamp)
* `is_active` (Boolean)

### 3. `Gazebos`
* `id` (PK, UUID)
* `event_id` (FK -> `Events.id`)
* `tier` (Enum: `LEVEL_1`, `LEVEL_2`, `LEVEL_3`)
* `gazebo_number` (Integer: 1 to 4 per level)
* `price` (Decimal: 85000 / 100000 / 125000)
* `status` (Enum: `AVAILABLE`, `RESERVED`, `BOOKED`)

### 4. `Bookings`
* `id` (PK, UUID)
* `booking_ref` (String, Unique, e.g. `SS-2026-89A7`)
* `user_id` (FK -> `Users.id`)
* `event_id` (FK -> `Events.id`)
* `total_amount` (Decimal)
* `booking_status` (Enum: `CREATED`, `PAYMENT_PENDING`, `PAYMENT_VERIFIED`, `CANCELLED`, `EXPIRED`)
* `payment_status` (Enum: `PENDING`, `RECEIVED`, `VERIFIED`, `REJECTED`, `REFUNDED`)
* `created_at` (Timestamp)

### 5. `BookingItems`
* `id` (PK, UUID)
* `booking_id` (FK -> `Bookings.id`)
* `pass_type` (Enum: `SINGLE`, `COUPLE`, `GAZEBO`)
* `gazebo_id` (FK -> `Gazebos.id`, Nullable)
* `quantity` (Integer)
* `unit_price` (Decimal)

### 6. `Passes`
* `id` (PK, UUID)
* `booking_item_id` (FK -> `BookingItems.id`)
* `pass_code` (String, Unique)
* `qr_token` (String, Cryptographic Unique)
* `attendee_name` (String)
* `attendee_phone` (String)
* `face_auth_ref` (String / Vector, Nullable)
* `pass_status` (Enum: `PENDING`, `PASS_ACTIVATED`, `READY_FOR_ENTRY`, `USED`, `BLOCKED`, `CANCELLED`)
* `is_used` (Boolean, Default: false)
* `used_at` (Timestamp, Nullable)

### 7. `Payments`
* `id` (PK, UUID)
* `booking_id` (FK -> `Bookings.id`)
* `cash_counter_id` (String)
* `executive_id` (FK -> `Users.id`)
* `amount_paid` (Decimal)
* `payment_status` (Enum: `VERIFIED`, `REJECTED`)
* `verified_at` (Timestamp)

### 8. `EntryScans`
* `id` (PK, UUID)
* `pass_id` (FK -> `Passes.id`)
* `officer_id` (FK -> `Users.id`)
* `gate_id` (String)
* `scan_result` (Enum: `APPROVED`, `DENIED`)
* `rejection_reason` (String, Nullable)
* `scanned_at` (Timestamp)

### 9. `Users` (Staff & Administrators)
* `id` (PK, UUID)
* `username` (String, Unique)
* `password_hash` (String)
* `role` (Enum: `ATTENDEE`, `TICKETING_FINANCE_EXECUTIVE`, `ENTRY_OFFICER`, `SUPER_ADMINISTRATOR`)
* `is_active` (Boolean)

### 10. `AuditLogs`
* `id` (PK, UUID)
* `actor_id` (FK -> `Users.id`)
* `actor_role` (String)
* `action` (String)
* `target_entity` (String)
* `target_id` (String)
* `previous_state` (JSONB)
* `new_state` (JSONB)
* `timestamp` (Timestamp)

---
*Document Part of Safed Sheri Master Specifications.*
