# Entity Relationship Specifications — Safed Sheri

## 1. Entity Relationship Mapping

```text
[ Events ] 1 ─── * [ TicketPhases ]
   │
   ├── 1 ─── * [ Gazebos ]
   │
   └── 1 ─── * [ Bookings ] 1 ─── * [ BookingItems ] 1 ─── * [ Passes ] 1 ─── * [ EntryScans ]
                     │                                         │
                     ├── 1 ─── * [ Payments ]                  └── * ─── 1 [ Users (Officers) ]
                     │
                     └── * ─── 1 [ Users (Attendees) ]
```

## 2. Cardinality Rules

* **Event -> TicketPhases:** 1 Event has many Pricing Phases.
* **Event -> Gazebos:** 1 Event has exactly 12 Gazebos (4 Level 1, 4 Level 2, 4 Level 3).
* **User -> Bookings:** 1 Attendee User can create multiple Bookings across events.
* **Booking -> BookingItems:** 1 Booking contains 1 or more Booking Items.
* **BookingItem -> Passes:** 1 Single Pass BookingItem creates 1 Pass; 1 Couple Pass BookingItem creates 2 Pass records or 1 linked Couple Pass record (**OPEN DECISION #8**).
* **Pass -> EntryScans:** 1 Pass can have multiple failed scan attempts, but exactly 1 APPROVED scan (`is_used = true`).

---
*Document Part of Safed Sheri Master Specifications.*
