# Biometric Data Handling Specifications — Safed Sheri

## 1. Biometric Vector Standardization

If automated face verification is enabled (**OPEN DECISION #10**), raw facial images should not be stored long-term in operational databases. Instead, facial features must be processed into non-reversible 512-dimensional vector embeddings.

```text
[ Attendee Registration Photo ]
               │
               ▼
[ Biometric Feature Extractor ] ──► Generates Vector Embedding (e.g. [0.12, -0.44, ...])
                                 ──► Drops Raw Image Source
                                 ──► Stores Encrypted Vector in DB
```

## 2. Consent & Automatic Purge Schedule

1. **Explicit Consent:** Booking flow requires an explicit opt-in checkbox acknowledging face verification at venue entry.
2. **Automatic Purge:** Vector embeddings and reference images are scheduled for automatic deletion within **30 days** following event completion.

---
*Document Part of Safed Sheri Master Specifications.*
