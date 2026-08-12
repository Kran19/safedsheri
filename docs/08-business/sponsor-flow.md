# Sponsor Application Workflow — Safed Sheri

## 1. Application Philosophy

For Version 1, sponsorship management operates via a lightweight public lead generation form integrated with the Super Administrator pipeline.

```text
[ Public Web Visitor ] ──► [ Navigates to /participate/sponsor ]
                                       │
                                       ▼
                       [ Fills Structured Lead Form ]
                                       │
                                       ▼
                       [ Submitted to Server Database ]
                                       │
                                       ▼
                       [ Appears in Super Admin Portal Pipeline ]
                                       │
                       (Status: NEW ──► IN_REVIEW ──► CONTACTED ──► APPROVED / REJECTED)
```

## 2. Collected Data Fields

* `company_name`: Official business/brand name.
* `contact_person`: Full name of primary contact.
* `phone_number`: WhatsApp contact phone.
* `email`: Official email address.
* `sponsorship_tier_interest`: (e.g. Title Sponsor, Co-Sponsor, Associate Sponsor, Food/Beverage Partner).
* `proposed_budget_range`: Optional budget dropdown.
* `additional_notes`: Text description of sponsorship goals.

---
*Document Part of Safed Sheri Master Specifications.*
