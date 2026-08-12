# Audit Log Specifications — Safed Sheri

## 1. Immutable Audit Logging

Every security-sensitive or financial operation must write a structured log entry into `AuditLogs`.

## 2. Audit Log Record Schema

```json
{
  "id": "aud_99482019",
  "actor_id": "usr_exec_441",
  "actor_role": "TICKETING_FINANCE_EXECUTIVE",
  "action": "PAYMENT_VERIFIED",
  "target_entity": "Booking",
  "target_id": "bok_8839201",
  "previous_state": { "payment_status": "PAYMENT_PENDING" },
  "new_state": { "payment_status": "PAYMENT_VERIFIED" },
  "metadata": {
    "cash_counter_id": "counter_01",
    "amount_received": 7500
  },
  "ip_address": "192.168.1.45",
  "user_agent": "SafedSheriCounter/1.0 (Android 14)",
  "timestamp": "2026-10-15T18:22:04.112Z"
}
```

---
*Document Part of Safed Sheri Master Specifications.*
