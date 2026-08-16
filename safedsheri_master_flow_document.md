# 🏆 SAFED SHERI 2026 — MASTER ARCHITECTURAL & USER FLOW GUIDE

## 🌐 Live Client Mobile & Desktop Access
- **Public Client Web App (Mobile Optimized)**: [https://safedsheri2026.loca.lt](https://safedsheri2026.loca.lt)
- **Local Host URL**: [http://localhost:3000](http://localhost:3000)
- **Super Admin Terminal**: [http://localhost:3000/admin](http://localhost:3000/admin) *(User: `admin@safedsheri.com` | Pass: `AdminPass123!`)*
- **Box Office Cashier Terminal**: [http://localhost:3000/cashier](http://localhost:3000/cashier)
- **Security Gate Scanner**: [http://localhost:3000/security](http://localhost:3000/security)

---

## 📱 Mobile UI & Minimal Header Enhancements

### 1. Minimal Luxury Header
* **Removed Date Clutter**: "09 OCTOBER 2026" has been removed from beneath the navbar logo to ensure a clean, uncluttered aesthetic.
* **Unified Alignment**: The header features the circular emblem, `SAFED SHERI` wordmark, interactive sound toggle `[🔊]`, `My Pass` ticket button, and `Book Pass` action.
* **Mobile-Responsive Spacing**: Balanced padding (`px-3 sm:px-6`, `py-2.5 sm:py-3.5`) ensures no wrapping on 320px–430px mobile viewports.

![Landing Hero Section](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/01_landing_hero.png)

---

### 2. 3D Cylindrical Sponsors & Brand Alliances
* **Real Vector Logos & Established Badges**: Replaced plain placeholders with custom luxury vector logos and authentic typography for all 8 official partners:
  1. **Jade Blue Lifestyle** — Official Luxury Ethnic Wear Partner (`EST. 1995`)
  2. **Club O7 Resort & Spa** — Grand Venue & Hospitality Partner (`EST. 2010`)
  3. **Wagh Bakri Tea Group** — Official Refreshment Partner (`EST. 1892`)
  4. **Havmor Gourmet** — Gourmet Dessert & Stalls Partner (`EST. 1944`)
  5. **Red FM 93.5** — Official Broadcast & Radio Partner (`AIRWAVES`)
  6. **Tanishq Jewellers** — Royal Gold & Diamond Partner (`ROYALTY`)
  7. **ICICI Bank** — Official Digital Payments & UPI Partner (`FINANCE`)
  8. **BMW Gallops Motors** — Official Luxury Mobility Partner (`MOTORS`)
* **Glassmorphism Backdrop**: Dual-tone gradient cards with smooth touch-drag and auto-rotation.

![3D Sponsors & Brand Alliances](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/02_3d_sponsors_gallery.png)

---

### 3. Clean Public Footer
* **Zero Staff/Admin Links**: Removed `Staff Login`, `Admin Portal`, `Cashier Desk`, and `Security Scanner` links from the public page footer.
* **Luxury Public Brand Footer**: Includes brand navigation links (`The Concept`, `75% White Rule`, `Gazebo Lounges`, `Brand Partners`, `Pass Privilege`), Club O7 venue details, and copyright.

---

### 4. Dynamic Pricing Sync & Concealment Engine
* **Instant Database Synchronization**: Fixed the initial static fallback issue by binding `fetchPricing()` inside a real-time interval hook. When Admin toggles prices **OFF** in the Admin Panel, the landing page updates automatically.
* **Concealed Pricing Badges**: When hidden, pass cards display a gold badge: `"✨ Price Revealed on Approval"` instead of raw amounts.

![Concealed Pricing & VIP Gazebos](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/03_gazebos_private_pricing.png)
![Pass Privilege Cards](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/04_pass_selection_cards.png)

---

## 🔄 Complete End-to-End User Flow (Booking to Entry)

```mermaid
flowchart TD
    A["Public User on Mobile/Desktop"] --> B["Select Single/Couple/Gazebo Pass (1 to 7 Guests)"]
    B --> C["Fill Attendee KYC & Upload Aadhaar Document"]
    C --> D["Submit Application (Status: UNDER_REVIEW)"]
    D --> E["Super Admin Reviews Each Attendee Individually"]
    E -->|Approved| F["Application Status: PAYMENT_PENDING (Amount Recalculated)"]
    E -->|Rejected with Reason| G["Candidate Wallet shows Note & 'Apply Again'"]
    F --> H["Candidate Opens 'My Pass' Wallet & Clicks 'Pay Now'"]
    H --> I["Dynamic Online UPI QR / Gateway Checkout (₹3,500)"]
    I --> J["Payment Confirmed & Digital Pass Issued (SS26-SINGLE-XXXX)"]
    J --> K["Gate Security Scans QR Code at Event Entry"]
    K --> L["🟢 ENTRY GRANTED (First Scan) / 🔴 DENIED (Duplicate)"]
```

---

### Flow 1: Step-by-Step Attendee Registration (Carousel Wizard)
1. User clicks **"Book Pass"** and chooses pass quantity (1 to 7 guests).
2. The interactive carousel guides user attendee-by-attendee with live draft auto-save and document upload.
3. Form validates:
   - Mandatory 10-digit mobile number with `5-5` digit grouping (`98765 43210`).
   - 12-digit Aadhaar number with `4-4-4` grouping (`1234 5678 9012`).
   - Duplicate Aadhaar and active pass prevention.

![Registration Form](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/05_single_pass_registration_form.png)
![Submission Confirmation](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/06_single_pass_submitted_confirmation.png)

---

### Flow 2: Super Admin Granular Review & Partial Approvals
1. Admin logs into the **Super Admin Terminal** ([http://localhost:3000/admin](http://localhost:3000/admin)).
2. In the Tabulator grid, Admin clicks **"Review"** on any pending booking.
3. In the **Executive KYC Review Modal**:
   - Admin views the uploaded Aadhaar document directly in the built-in modal viewer.
   - Each guest in a squad has independent **`[✓ Approve]`** and **`[✕ Reject]`** buttons.
   - If one guest has a blurry Aadhaar, Admin rejects only that person with note `"Aadhaar number is not proper visible"`.
   - The total payable amount automatically recalculates for approved guests.

![Admin Tabulator Grid](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/12_admin_dashboard_tabulator.png)
![Granular Review Modal](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/13_admin_application_review_modal.png)
![Application Approved](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/14_admin_application_approved.png)

---

### Flow 3: Candidate Wallet & 100% Online Checkout
1. Candidate searches their mobile number or Aadhaar in **My Pass** wallet.
2. **Approved Guest**: Sees their payment pending order card. Historical rejections are suppressed.
3. Candidate clicks **"Pay Now"**, scans the dynamic UPI QR code, and completes payment.
4. Active digital pass `SS26-SINGLE-XXXX` is minted with high-contrast QR token.

![Candidate Wallet Payment Pending](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/18_candidate_wallet_payment_pending.png)
![Online UPI Checkout](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/19_online_payment_checkout_modal.png)
![Online Payment Confirmed](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/20_online_payment_confirmed.png)
![Live Digital Pass in Wallet](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/21_candidate_wallet_active_pass.png)

---

### Flow 4: Security Gate Entry & Anti-Passback Validation
1. Gate staff opens the **Security Terminal** ([http://localhost:3000/security](http://localhost:3000/security)).
2. **First Scan**: Pass validated 🟢 `ENTRY GRANTED (VALID)` — displays attendee details and 75% white dress code reminder.
3. **Second Scan (Attempted reuse)**: 🔴 `ENTRY DENIED (ALREADY_USED)` — prevents ticket sharing.

![Security Gate Terminal](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/25_security_scanner_terminal.png)
![Entry Granted](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/26_security_scan_valid_entry.png)
![Duplicate Scan Denied](file:///C:/Users/PC/.gemini/antigravity-ide/brain/62c84711-be47-4d62-b37c-ac861ddf8a91/screenshots/27_security_scan_duplicate_denied.png)
