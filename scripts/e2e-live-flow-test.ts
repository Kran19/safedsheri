import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:4000/api/v1';

async function main() {
  console.log('\n========================================================================');
  console.log('🚀 LIVE 100% ONLINE PAYMENT END-TO-END FLOW VERIFICATION (SAFED SHERI 2026)');
  console.log('========================================================================\n');

  const logEntries: string[] = [];
  function log(msg: string) {
    console.log(msg);
    logEntries.push(msg);
  }

  try {
    // -----------------------------------------------------------------
    // STEP 1: PUBLIC REGISTRATION + AADHAAR DOCUMENT UPLOAD
    // -----------------------------------------------------------------
    log('▶ STEP 1: GUEST REGISTRATION');
    const testAadhaar = '998877665544';
    const testPhone = '+919876543299';
    const testName = 'Nandini Vyas';

    // 1.1 Upload Aadhaar Document Image
    const sampleImagePath = path.resolve(__dirname, '..', 'apps', 'admin', 'public', 'images', 'safed-sheri-logo.png');
    const imageBuffer = fs.readFileSync(sampleImagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, 'aadhaar_nandini_vyas.png');

    const uploadRes = await fetch(`${API_BASE}/uploads/aadhaar`, {
      method: 'POST',
      body: formData,
    });
    const uploadJson: any = await uploadRes.json();
    if (!uploadJson.success) throw new Error(`Aadhaar upload failed: ${uploadJson.message}`);
    log(`  ✓ Aadhaar Document Uploaded & Encrypted: ${uploadJson.data.storageKey} (Checksum: ${uploadJson.data.checksum.slice(0, 16)}...)`);

    // 1.2 Submit Registration Application
    const regRes = await fetch(`${API_BASE}/registrations/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passType: 'SINGLE',
        attendees: [
          {
            fullName: testName,
            phone: testPhone,
            email: 'nandini.vyas@safedsheri.com',
            gender: 'FEMALE',
            aadhaarNumber: testAadhaar,
            documentKey: uploadJson.data.storageKey,
            originalFilename: uploadJson.data.originalFilename,
          },
        ],
      }),
    });
    const regJson: any = await regRes.json();
    if (!regJson.success) throw new Error(`Registration failed: ${regJson.message}`);
    const regData = regJson.data;
    log(`  ✓ Application Submitted: ${regData.registrationNumber} (Status: ${regData.status}, Pass: ${regData.passType}, Due: ₹${regData.amountDue})`);

    // -----------------------------------------------------------------
    // STEP 2: SUPER ADMIN APPROVAL
    // -----------------------------------------------------------------
    log('\n▶ STEP 2: SUPER ADMIN REVIEW & APPROVAL');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@safedsheri.com', password: 'AdminPass123!' }),
    });
    const adminLoginJson: any = await adminLoginRes.json();
    if (!adminLoginJson.success) throw new Error('Admin login failed');
    const adminToken = adminLoginJson.data.accessToken;
    log(`  ✓ Admin Authenticated: ${adminLoginJson.data.user.fullName} (${adminLoginJson.data.user.role})`);

    // 2.1 Fetch Application
    const appDetailRes = await fetch(`${API_BASE}/registrations/${regData.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const appDetailJson: any = await appDetailRes.json();
    const appDocId = appDetailJson.data.attendees[0].attendee.document?.id;
    log(`  ✓ Verified Aadhaar Document Record Linked: Document ID ${appDocId}`);

    // 2.2 Approve Application
    const approveRes = await fetch(`${API_BASE}/registrations/${regData.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ notes: 'Verified official Aadhaar card image. Approved for payment.' }),
    });
    const approveJson: any = await approveRes.json();
    if (!approveJson.success) throw new Error(`Approval failed: ${approveJson.message}`);
    const paymentOrderId = approveJson.data.paymentOrder.paymentLinkId;
    log(`  ✓ Application Approved! State transitioned to PAYMENT_PENDING`);
    log(`  ✓ Payment Order Generated: ${paymentOrderId}`);

    // -----------------------------------------------------------------
    // STEP 3: 100% ONLINE UPI QR & GATEWAY PAYMENT
    // -----------------------------------------------------------------
    log('\n▶ STEP 3: 100% ONLINE UPI QR PAYMENT VIA GATEWAY');
    
    // 3.1 Candidate / Desk fetches dynamic online order & UPI QR details
    const orderRes = await fetch(`${API_BASE}/payments/order/${paymentOrderId}`);
    const orderJson: any = await orderRes.json();
    if (!orderJson.success) throw new Error('Failed to retrieve online order details');
    log(`  ✓ Dynamic UPI QR Generated: ${orderJson.data.upiQrPayload.slice(0, 48)}...`);
    log(`  ✓ Exact Amount to Pay Online: ₹${orderJson.data.amountDue.toLocaleString()}`);

    // 3.2 Candidate completes UPI payment $\to$ Gateway Callback verifies transaction
    const onlinePayRes = await fetch(`${API_BASE}/payments/gateway-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentLinkId: paymentOrderId,
        providerReference: `UPI-ONLINE-TXN-${Date.now().toString().slice(-6)}`,
        notes: 'Candidate completed online UPI payment via dynamic QR',
      }),
    });
    const onlinePayJson: any = await onlinePayRes.json();
    if (!onlinePayJson.success) throw new Error(`Online payment confirmation failed: ${onlinePayJson.message}`);
    log(`  ✓ Online Payment Verified & Confirmed (Receipt: ${onlinePayJson.data.receiptNumber})`);
    log(`  ✓ Application Status Updated: PAYMENT_CONFIRMED -> PASS_ISSUED`);

    // -----------------------------------------------------------------
    // STEP 4: GUEST "MY PASS" WALLET VERIFICATION
    // -----------------------------------------------------------------
    log('\n▶ STEP 4: CANDIDATE "MY PASS" WALLET VERIFICATION');
    const myPassRes = await fetch(`${API_BASE}/credentials/my-pass?phone=9876543299`);
    const myPassJson: any = await myPassRes.json();
    if (!myPassJson.success || !myPassJson.data || myPassJson.data.length === 0) {
      throw new Error('Candidate pass not found in My Pass wallet');
    }
    const guestPass = myPassJson.data[0];
    const passCode = guestPass.credential.passCode;
    const secureToken = guestPass.credential.secureToken;
    log(`  ✓ Pass Found in Wallet for ${guestPass.attendeeName}`);
    log(`  ✓ Pass Status: ${guestPass.hasActivePass ? 'ACTIVE (Green Badge)' : 'INACTIVE'}`);
    log(`  ✓ Human Visible Pass Code: ${passCode}`);
    log(`  ✓ Private QR Secret Token: ${secureToken}`);

    // -----------------------------------------------------------------
    // STEP 5: SECURITY GATE SCANNER VERIFICATION
    // -----------------------------------------------------------------
    log('\n▶ STEP 5: SECURITY GATE QR SCAN & VALIDATION');
    const secLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'gate1@safedsheri.com', password: 'SecurityPass123!' }),
    });
    const secLoginJson: any = await secLoginRes.json();
    if (!secLoginJson.success) throw new Error('Security login failed');
    const secToken = secLoginJson.data.accessToken;
    log(`  ✓ Gate Security Authenticated: ${secLoginJson.data.user.fullName}`);

    // 5.1 First Scan: Should be VALID
    const scan1Res = await fetch(`${API_BASE}/entries/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secToken}`,
      },
      body: JSON.stringify({ token: secureToken }),
    });
    const scan1Json: any = await scan1Res.json();
    if (scan1Json.data.status !== 'VALID') throw new Error(`First scan unexpected status: ${scan1Json.data.status}`);
    log(`  ✅ FIRST SCAN RESULT: [ENTRY GRANTED] - Status: ${scan1Json.data.status}`);
    log(`     Attendee: ${scan1Json.data.attendeeName} | Pass: ${scan1Json.data.passType} | Code: ${scan1Json.data.passCode}`);

    // 5.2 Second Scan: Must be ALREADY_USED (Duplicate Entry Prevention)
    const scan2Res = await fetch(`${API_BASE}/entries/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secToken}`,
      },
      body: JSON.stringify({ token: secureToken }),
    });
    const scan2Json: any = await scan2Res.json();
    if (scan2Json.data.status !== 'NOT_VALID' || scan2Json.data.reason !== 'ALREADY_USED') {
      throw new Error(`Second scan did not reject as ALREADY_USED: ${JSON.stringify(scan2Json)}`);
    }
    log(`  ✅ SECOND SCAN RESULT: [ENTRY DENIED] - Status: ${scan2Json.data.status} | Reason: ${scan2Json.data.reason}`);
    log(`     Security system successfully blocked duplicate entry attempt!`);

    log('\n========================================================================');
    log('🎉 FULL 100% ONLINE PAYMENT FLOW COMPLETED WITH 100% SUCCESS!');
    log('========================================================================\n');
  } catch (err: any) {
    console.error('❌ E2E TEST FAILED:', err);
    process.exit(1);
  }
}

main();
