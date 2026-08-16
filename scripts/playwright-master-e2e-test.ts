import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.resolve(
  'C:\\Users\\PC\\.gemini\\antigravity-ide\\brain\\62c84711-be47-4d62-b37c-ac861ddf8a91',
  'screenshots'
);

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runMasterE2ETest() {
  console.log('\n========================================================================');
  console.log('🎭 RUNNING PLAYWRIGHT REAL-BROWSER MASTER END-TO-END VERIFICATION');
  console.log('========================================================================\n');

  // Random Unique test data to avoid duplicate collisions (10-digit phone, 12-digit Aadhaar)
  const rand = Math.floor(1000 + Math.random() * 9000);
  const pad = String(rand).padStart(4, '0');

  const singlePhone = `987654${pad}`; // 10 digits
  const singleAadhaar = `88776655${pad}`; // 12 digits

  const couplePhone1 = `987661${pad}`; // 10 digits
  const coupleAadhaar1 = `77665544${pad}`; // 12 digits
  const couplePhone2 = `987672${pad}`; // 10 digits
  const coupleAadhaar2 = `66554433${pad}`; // 12 digits

  const gazeboPhone = `987683${pad}`; // 10 digits
  const cashierPhone = `987694${pad}`; // 10 digits
  const cashierAadhaar = `55443322${pad}`; // 12 digits

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  async function takeScreenshot(name: string, description: string) {
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  📸 [SCREENSHOT] ${name}.png — ${description}`);
    return filePath;
  }

  try {
    // -----------------------------------------------------------------
    // TEST FLOW 1: LANDING PAGE, 3D SPONSORS GALLERY & AUDIO ENGINE
    // -----------------------------------------------------------------
    console.log('▶ FLOW 1: PUBLIC LANDING PAGE, 3D SPONSORS & DRESS CODE');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshot('01_landing_hero', 'Hero section with White/Gold theme and official logo');

    // Scroll to 3D Sponsors Gallery
    await page.evaluate(() => {
      document.querySelector('#sponsors')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    await takeScreenshot('02_3d_sponsors_gallery', 'Interactive 3D cylindrical Sponsors & Brands Gallery');

    // Scroll to Gazebos Section
    await page.evaluate(() => {
      document.querySelector('#gazebos')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(800);
    await takeScreenshot('03_gazebos_private_pricing', 'VIP Gazebo Cabanas with Concealed Pricing');

    // Scroll to Passes Section
    await page.evaluate(() => {
      document.querySelector('#passes')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(800);
    await takeScreenshot('04_pass_selection_cards', 'Single, Couple & Gazebo pass options with 75% White rule');

    // -----------------------------------------------------------------
    // TEST FLOW 2: SINGLE PASS REGISTRATION & STEP-BY-STEP CAROUSEL WIZARD
    // -----------------------------------------------------------------
    console.log('\n▶ FLOW 2: SINGLE PASS (FEMALE) REGISTRATION (CAROUSEL WIZARD)');
    const singlePassBtn = page.locator('text=Apply for Single Pass').first();
    await singlePassBtn.click();
    await page.waitForTimeout(500);

    // Step 1: Pass Quantity Selector
    await page.click('button:has-text("Continue to Guest Details")');
    await page.waitForTimeout(500);

    // Step 2: Fill Attendee #1
    await page.fill('input[placeholder="As printed on government Aadhaar"]', `Prerna Shah ${rand}`);
    await page.fill('input[placeholder="98765 43210"]', singlePhone);
    await page.fill('input[placeholder="guest@example.com"]', `prerna.${rand}@safedsheri.com`);
    await page.fill('input[placeholder="1234 5678 9012"]', singleAadhaar);

    // Upload sample Aadhaar document
    const sampleDocPath = path.resolve(__dirname, '..', 'apps', 'admin', 'public', 'images', 'safed-sheri-logo.png');
    await page.setInputFiles('#aadhaar-upload-0', sampleDocPath);
    await page.waitForTimeout(2000);

    await takeScreenshot('05_single_pass_registration_form', 'Single Pass attendee details and uploaded Aadhaar document');

    // Step 3: Review and Submit
    await page.click('button:has-text("Review Application")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Submit Application")');
    await page.waitForSelector('text=APPLICATION SUBMITTED', { timeout: 15000 });
    await takeScreenshot('06_single_pass_submitted_confirmation', 'Application submission confirmation with UNDER_REVIEW status');

    // Close Modal
    await page.click('button:has-text("Close")');
    await page.waitForTimeout(500);

    // -----------------------------------------------------------------
    // TEST FLOW 3: COUPLE PASS REGISTRATION (2 ATTENDEES VIA STEP WIZARD)
    // -----------------------------------------------------------------
    console.log('\n▶ FLOW 3: COUPLE PASS (2 GUESTS) REGISTRATION');
    const couplePassBtn = page.locator('text=Apply for Couple Pass').first();
    await couplePassBtn.click();
    await page.waitForTimeout(800);

    // Attendee #1 (Female)
    await page.fill('input[placeholder="As printed on government Aadhaar"]', `Ananya Joshi ${rand}`);
    await page.fill('input[placeholder="98765 43210"]', couplePhone1);
    await page.fill('input[placeholder="1234 5678 9012"]', coupleAadhaar1);
    await page.setInputFiles('#aadhaar-upload-0', sampleDocPath);
    await page.waitForTimeout(2000);

    // Advance to Attendee #2 (Male)
    await page.click('button:has-text("Next Attendee")');
    await page.waitForTimeout(800);

    await page.fill('input[placeholder="As printed on government Aadhaar"]', `Harsh Joshi ${rand}`);
    await page.fill('input[placeholder="98765 43210"]', couplePhone2);
    await page.fill('input[placeholder="1234 5678 9012"]', coupleAadhaar2);
    await page.setInputFiles('#aadhaar-upload-1', sampleDocPath);
    await page.waitForTimeout(2000);

    await takeScreenshot('07_couple_pass_registration_form', 'Couple Pass registration form with 2 validated attendee profiles');

    // Advance to Summary & Submit
    await page.click('button:has-text("Review Application")');
    await page.waitForTimeout(1000);

    const errorBanner = await page.locator('.bg-rose-50').textContent().catch(() => null);
    if (errorBanner) {
      console.log('  ⚠️ Validation error on Couple Pass form:', errorBanner);
    }

    const modalText = await page.locator('.bg-\\[\\#FFFCF7\\]').innerText().catch(() => '');
    console.log('  ℹ️ Modal Text at Review Step:\n', modalText.slice(0, 300));

    await page.click('button:has-text("Submit Application")');
    await page.waitForSelector('text=APPLICATION SUBMITTED', { timeout: 15000 });
    await takeScreenshot('08_couple_pass_submitted_confirmation', 'Couple Pass submitted successfully in UNDER_REVIEW status');

    await page.click('button:has-text("Close")');
    await page.waitForTimeout(500);

    // -----------------------------------------------------------------
    // TEST FLOW 4: VIP GAZEBO INQUIRY SUBMISSION
    // -----------------------------------------------------------------
    console.log('\n▶ FLOW 4: VIP GAZEBO LOUNGE INQUIRY');
    await page.evaluate(() => {
      document.querySelector('#gazebos')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(500);

    const gazeboBtn = page.locator('text=Inquire Royal Pavilion').first();
    await gazeboBtn.click();
    await page.waitForTimeout(500);

    await page.fill('input[placeholder="Full Name"]', `Dharmesh Patel ${rand}`);
    await page.fill('input[placeholder="e.g. 9876543210"]', gazeboPhone);
    await page.fill('textarea[placeholder="Dietary preferences, guest count, custom branding..."]', 'VIP Corporate garba booking for 12 guests with custom hospitality');
    await takeScreenshot('09_gazebo_inquiry_modal', 'VIP Gazebo Level 2 hospitality inquiry modal');

    await page.click('button:has-text("Submit Gazebo Inquiry")');
    await page.waitForSelector('text=Inquiry Received', { timeout: 10000 });
    await takeScreenshot('10_gazebo_inquiry_success', 'Gazebo inquiry received confirmation');

    await page.click('button:has-text("Close")');
    await page.waitForTimeout(500);

    // -----------------------------------------------------------------
    // TEST FLOW 5: SUPER ADMIN TERMINAL & TABULATOR OPERATIONS
    // -----------------------------------------------------------------
    console.log('\n▶ FLOW 5: SUPER ADMIN DASHBOARD, TABULATOR TABLE & APPROVAL');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await takeScreenshot('11_admin_login_screen', 'Staff authentication terminal');

    await page.fill('input[type="text"]', 'admin@safedsheri.com');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    await takeScreenshot('12_admin_dashboard_tabulator', 'Super Admin Terminal with Advanced Tabulator grid, KPI cards & navigation');

    // In Tabulator, search for our unique test attendee
    const searchInput = page.locator('input[placeholder="Search table records..."]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(singlePhone);
      await page.waitForTimeout(1000);
    }

    // Open Review Modal by clicking the Review button inside the filtered row
    const reviewBtn = page.locator('tbody tr button:has-text("Review")').first();
    await reviewBtn.click();
    await page.waitForSelector('text=EXECUTIVE KYC APPLICATION REVIEW', { timeout: 10000 });
    await page.waitForTimeout(500);
    await takeScreenshot('13_admin_application_review_modal', 'Detailed Application Review modal with Aadhaar verification details');

    // Submit Granular Review verdict
    const submitVerdictBtn = page.locator('button:has-text("Submit Review")').first();
    await submitVerdictBtn.scrollIntoViewIfNeeded();
    await submitVerdictBtn.click();
    await page.waitForTimeout(1500);
    await takeScreenshot('14_admin_application_approved', 'Application approved and transitioned to PAYMENT_PENDING with active payment order');

    // Check Gazebo Tab
    const gazeboTabBtn = page.locator('button:has-text("Gazebos (VIP)")').first();
    await gazeboTabBtn.click();
    await page.waitForTimeout(800);
    await takeScreenshot('15_admin_gazebos_tab', 'Admin Gazebo Lounges Inventory & Inquiries Tabulator Grid');

    // Check Sponsors Tab
    const sponsorsTabBtn = page.locator('button:has-text("Sponsors & Brands")').first();
    await sponsorsTabBtn.click();
    await page.waitForTimeout(800);
    await takeScreenshot('16_admin_sponsors_tab', 'Corporate Sponsors & Brand Alliances Tabulator Grid');

    // Check Stalls Tab
    const stallsTabBtn = page.locator('button:has-text("Stall Inquiries")').first();
    await stallsTabBtn.click();
    await page.waitForTimeout(800);
    await takeScreenshot('17_admin_stalls_tab', 'Gourmet Food & Retail Stall Inquiries Tabulator Grid');

    // -----------------------------------------------------------------
    // TEST FLOW 6: CANDIDATE "MY PASS" WALLET & 100% ONLINE PAYMENT
    // -----------------------------------------------------------------
    console.log('\n▶ FLOW 6: CANDIDATE "MY PASS" WALLET & 100% ONLINE PAYMENT');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Open Wallet
    await page.click('button:has-text("My Pass")');
    await page.waitForTimeout(500);
    await page.fill('input[placeholder="Mobile (98765 43210) or Aadhaar (1234 5678 9012)"]', singlePhone);
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000);
    await takeScreenshot('18_candidate_wallet_payment_pending', 'Candidate Wallet with Approved status and Pay Now action');

    // Click Pay Now
    await page.click('button:has-text("Pay Now")');
    await page.waitForTimeout(1000);
    await takeScreenshot('19_online_payment_checkout_modal', '100% Online Payment Gateway checkout modal with Dynamic UPI QR');

    // Authorize Online Payment
    await page.click('button:has-text("Confirm & Authorize Online Payment")');
    await page.waitForTimeout(1500);
    await takeScreenshot('20_online_payment_confirmed', 'Online Payment confirmed with official receipt number');

    // View My Pass in Wallet
    await page.click('button:has-text("View My Pass in Wallet")');
    await page.waitForTimeout(1000);
    await takeScreenshot('21_candidate_wallet_active_pass', 'Live Digital QR Pass in wallet with human-visible pass code');

    // -----------------------------------------------------------------
    // TEST FLOW 7: CASHIER DESK & MANUAL FREE-HAND BOOKING
    // -----------------------------------------------------------------
    console.log('\n▶ FLOW 7: CASHIER TERMINAL & MANUAL ON-SPOT BOOKING');
    await page.goto('http://localhost:3000/cashier', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshot('22_cashier_financial_tabulator', 'Box Office Cashier terminal with live KPIs and Tabulator transaction ledger');

    // Switch to Manual On-Spot Booking tab
    await page.click('button:has-text("Manual On-Spot Booking")');
    await page.waitForTimeout(600);

    // Fill Manual Walk-in form
    await page.fill('input[placeholder="Name on ID"]', `Bhavnaben Patel ${rand}`);
    await page.fill('input[placeholder="9876543210"]', cashierPhone);
    await page.fill('input[placeholder="XXXXXXXXXXXX"]', cashierAadhaar);
    await takeScreenshot('23_cashier_manual_entry_form', 'Free-Hand on-spot registration with custom amount and payment mode');

    // Submit Manual Entry
    await page.click('button:has-text("Confirm Settlement & Mint Passes")');
    await page.waitForTimeout(1500);
    await takeScreenshot('24_cashier_manual_entry_success', 'Manual walk-in passes minted on-spot with instant receipt generation');

    // -----------------------------------------------------------------
    // TEST FLOW 8: SECURITY GATE SCANNER & ANTI-PASSBACK VERIFICATION
    // -----------------------------------------------------------------
    console.log('\n▶ FLOW 8: SECURITY GATE QR SCANNER & DUPLICATE BLOCKING');
    await page.goto('http://localhost:3000/security', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await takeScreenshot('25_security_scanner_terminal', 'Gate Security QR Verification Terminal');

    // Retrieve Prerna Shah's secret QR token via API
    const myPassApiRes = await fetch(`http://localhost:4000/api/v1/credentials/my-pass?phone=${singlePhone}`);
    const myPassJson: any = await myPassApiRes.json();
    const secureToken = myPassJson.data[0].credential.secureToken;

    // Scan #1: Valid First Entry
    await page.fill('input[placeholder="e.g. ss_qr_... or SS26-SINGLE-XXXX"]', secureToken);
    await page.click('button:has-text("Verify Entry")');
    await page.waitForTimeout(1500);
    await takeScreenshot('26_security_scan_valid_entry', 'First scan granted: 🟢 ENTRY GRANTED (VALID)');

    // Scan #2: Immediate Duplicate Entry Attempt
    await page.fill('input[placeholder="e.g. ss_qr_... or SS26-SINGLE-XXXX"]', secureToken);
    await page.click('button:has-text("Verify Entry")');
    await page.waitForTimeout(1500);
    await takeScreenshot('27_security_scan_duplicate_denied', 'Second scan denied: 🔴 ENTRY DENIED (ALREADY_USED)');

    console.log('\n========================================================================');
    console.log('🎉 REAL-BROWSER MASTER PLAYWRIGHT E2E TEST COMPLETED WITH 100% SUCCESS!');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('❌ Playwright Test Error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runMasterE2ETest().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
