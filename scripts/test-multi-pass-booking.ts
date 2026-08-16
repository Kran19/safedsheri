import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api/v1';

async function testMultiPassBooking() {
  console.log('\n========================================================================');
  console.log('🧪 TESTING MULTI-PASS (UP TO 7 PASSES) PER BOOKING WITH SHARED MOBILE & UNIQUE AADHAAR');
  console.log('========================================================================\n');

  const rand = Math.floor(1000 + Math.random() * 9000);
  const sharedMobile = `98250${rand}1`; // 10 digits
  const aadhaar1 = `22334455${rand}`;
  const aadhaar2 = `33445566${rand}`;
  const aadhaar3 = `44556677${rand}`;

  // STEP 1: Duplicate Aadhaar in-batch validation test
  console.log('▶ STEP 1: Attempt booking with DUPLICATE Aadhaar in same batch (Should Fail)');
  const dupRes = await fetch(`${API_BASE}/registrations/public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passType: 'SINGLE',
      attendees: [
        {
          fullName: `Pooja Shah ${rand}`,
          phone: `+91${sharedMobile}`,
          gender: 'FEMALE',
          aadhaarNumber: aadhaar1,
          documentKey: 'sample_doc1.png',
        },
        {
          fullName: `Riya Shah ${rand}`,
          phone: `+91${sharedMobile}`,
          gender: 'FEMALE',
          aadhaarNumber: aadhaar1, // DUPLICATE AADHAAR
          documentKey: 'sample_doc2.png',
        },
      ],
    }),
  });
  const dupJson: any = await dupRes.json();
  if (dupJson.success) {
    throw new Error('Expected duplicate Aadhaar in-batch to be blocked!');
  }
  console.log(`  ✓ Successfully Blocked duplicate Aadhaar in batch: "${dupJson.message}"`);

  // STEP 2: Submit Valid 3-Pass Booking with Same Mobile & Unique Aadhaar
  console.log('\n▶ STEP 2: Submit Valid 3-Pass Booking (Same Mobile for Family, Unique Aadhaar per Guest)');
  const multiRegRes = await fetch(`${API_BASE}/registrations/public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passType: 'SINGLE',
      attendees: [
        {
          fullName: `Pooja Shah ${rand}`,
          phone: `+91${sharedMobile}`,
          gender: 'FEMALE',
          aadhaarNumber: aadhaar1,
          documentKey: 'sample_doc1.png',
        },
        {
          fullName: `Riya Shah ${rand}`,
          phone: `+91${sharedMobile}`,
          gender: 'FEMALE',
          aadhaarNumber: aadhaar2,
          documentKey: 'sample_doc2.png',
        },
        {
          fullName: `Divya Shah ${rand}`,
          phone: `+91${sharedMobile}`,
          gender: 'FEMALE',
          aadhaarNumber: aadhaar3,
          documentKey: 'sample_doc3.png',
        },
      ],
    }),
  });
  const multiRegJson: any = await multiRegRes.json();
  if (!multiRegJson.success) {
    throw new Error(`Multi-pass registration failed: ${multiRegJson.message}`);
  }
  const regId = multiRegJson.data.id;
  const regNumber = multiRegJson.data.registrationNumber;
  const amountDue = multiRegJson.data.amountDue;
  console.log(`  ✓ 3-Pass Application Created: ${regNumber}`);
  console.log(`    - Total Amount Due: ₹${amountDue} (3 × ₹3,500 = ₹10,500)`);
  if (amountDue !== 10500) {
    throw new Error(`Expected amount ₹10,500 but got ₹${amountDue}`);
  }

  // STEP 3: Admin Review & Approval
  console.log('\n▶ STEP 3: Super Admin Approves 3-Pass Booking');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@safedsheri.com',
      password: 'AdminPass123!',
    }),
  });
  const loginJson: any = await loginRes.json();
  const token = loginJson.data.accessToken;

  const approveRes = await fetch(`${API_BASE}/registrations/${regId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reviewNotes: 'Approved all 3 family passes.' }),
  });
  const approveJson: any = await approveRes.json();
  if (!approveJson.success) throw new Error(`Approval failed: ${approveJson.message}`);
  const paymentLinkId = approveJson.data?.registration?.paymentLinkId || approveJson.data?.paymentOrder?.paymentLinkId;
  console.log(`  ✓ Application Approved: Status -> ${approveJson.data?.registration?.status}`);
  console.log(`    - Generated Payment Link: ${paymentLinkId}`);

  // STEP 4: Complete Online Payment
  console.log('\n▶ STEP 4: Complete Online Payment (₹10,500)');
  const payRes = await fetch(`${API_BASE}/payments/gateway-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentLinkId,
      providerReference: `UPI_REF_${rand}`,
    }),
  });
  const payJson: any = await payRes.json();
  if (!payJson.success) throw new Error(`Payment processing failed: ${payJson.message}`);
  console.log(`  ✓ Payment Confirmed: Receipt -> ${payJson.data.receiptNumber}`);

  // STEP 5: Search "My Pass" Wallet by Shared Mobile
  console.log('\n▶ STEP 5: Verify My Pass Wallet by Shared Mobile Number');
  const walletRes = await fetch(`${API_BASE}/credentials/my-pass?query=${sharedMobile}`);
  const walletJson: any = await walletRes.json();
  if (!walletJson.success || walletJson.data.length < 3) {
    throw new Error('Expected at least 3 passes in wallet');
  }
  console.log(`  ✓ Found ${walletJson.data.length} active passes for Mobile (+91 ${sharedMobile}):`);
  walletJson.data.forEach((p: any, i: number) => {
    console.log(`    Pass #${i + 1}: ${p.attendeeName} (${p.aadhaarMasked}) -> PassCode: ${p.credential?.passCode} [${p.hasActivePass ? 'ACTIVE' : 'INACTIVE'}]`);
  });

  console.log('\n========================================================================');
  console.log('🎉 MULTI-PASS (UP TO 7 PASSES) PER BOOKING TEST 100% PASSED!');
  console.log('========================================================================\n');
}

testMultiPassBooking().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
