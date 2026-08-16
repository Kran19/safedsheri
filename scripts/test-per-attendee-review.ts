const API_BASE = 'http://localhost:4000/api/v1';

async function testPerAttendeeReviewAndWallet() {
  console.log('========================================================================');
  console.log('⚡ TESTING GRANULAR PER-ATTENDEE REVIEW & CLEAN WALLET FILTERING');
  console.log('========================================================================\n');

  const timestamp = Date.now().toString().slice(-4);
  const shakshiPhone = `916350${timestamp}`;
  const karanPhone = `916360${timestamp}`;
  const shakshiAadhaar = `88776655${timestamp}`;
  const karanAadhaar = `99887766${timestamp}`;

  // Step 1: Submit a 2-Pass Registration Application
  console.log('▶ Step 1: Submitting 2-Pass Booking (Shakshi & Karan)');
  const submitRes = await fetch(`${API_BASE}/registrations/public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passType: 'SINGLE',
      attendees: [
        {
          fullName: `Shakshi Patel ${timestamp}`,
          phone: shakshiPhone,
          gender: 'FEMALE',
          aadhaarNumber: shakshiAadhaar,
          documentKey: 'sample_shakshi.jpg',
          originalFilename: 'shakshi_aadhaar.jpg',
        },
        {
          fullName: `Karan Sharma ${timestamp}`,
          phone: karanPhone,
          gender: 'FEMALE',
          aadhaarNumber: karanAadhaar,
          documentKey: 'sample_karan.jpg',
          originalFilename: 'karan_aadhaar.jpg',
        },
      ],
    }),
  });

  const submitJson = await submitRes.json();
  console.log('  Submission Status:', submitJson.success ? '✓ 201 CREATED' : '✗ FAILED');
  console.log('  Submission Response:', submitJson);
  const regId = submitJson.data?.id;
  const regNumber = submitJson.data?.registrationNumber;
  console.log(`  Application: ${regNumber} (ID: ${regId})`);

  // Step 2: Login as Super Admin and Fetch Application Details
  console.log('\n▶ Step 2: Super Admin Login & Inspecting Application Details');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@safedsheri.com',
      password: 'AdminPass123!',
    }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data.accessToken;

  const getAppRes = await fetch(`${API_BASE}/registrations/${regId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getAppJson = await getAppRes.json();
  const appData = getAppJson.data;
  console.log(`  Attendees in batch: ${appData.attendees.length}`);
  const att1 = appData.attendees[0].attendee;
  const att2 = appData.attendees[1].attendee;
  console.log(`  - Guest #1: ${att1.fullName} (${att1.id})`);
  console.log(`  - Guest #2: ${att2.fullName} (${att2.id})`);

  // Step 3: Granular Review: APPROVE Shakshi, REJECT Karan
  console.log('\n▶ Step 3: Performing Granular Review: Approve Shakshi, Reject Karan');
  const reviewRes = await fetch(`${API_BASE}/registrations/${regId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      globalNotes: 'KYC Verification Decision',
      attendeeDecisions: [
        {
          attendeeId: att1.id,
          status: 'APPROVED',
          reviewNotes: 'Document verified perfectly.',
        },
        {
          attendeeId: att2.id,
          status: 'REJECTED',
          reviewNotes: 'Aadhar number is not proper visible',
        },
      ],
    }),
  });

  const reviewJson = await reviewRes.json();
  console.log('  Review Status:', reviewJson.success ? '✓ 200 OK' : '✗ FAILED');
  console.log('  Updated Application Status:', reviewJson.data.registration?.status);
  console.log('  Recalculated Amount Due:', `₹${reviewJson.data.recalculatedAmount}`);
  console.log('  Approved Count:', reviewJson.data.approvedCount, '| Rejected Count:', reviewJson.data.rejectedCount);

  // Step 4: Verify Candidate Wallet for Shakshi
  console.log('\n▶ Step 4: Verifying Candidate Wallet for Approved Guest (Shakshi)');
  const walletShakshiRes = await fetch(`${API_BASE}/credentials/my-pass?query=${shakshiPhone}`);
  const walletShakshiJson = await walletShakshiRes.json();
  console.log(`  Shakshi Cards Count: ${walletShakshiJson.data.length}`);
  const shakshiCard = walletShakshiJson.data[0];
  console.log('  Shakshi Status:', shakshiCard.registrationStatus, '| isPaymentPending:', shakshiCard.isPaymentPending, '| isRejected:', shakshiCard.isRejected);
  
  if (shakshiCard.isRejected === true) {
    throw new Error('Shakshi is approved but isRejected was true!');
  }
  if (walletShakshiJson.data.some((c: any) => c.isRejected)) {
    throw new Error('Shakshi has an approved registration but wallet returned rejected card!');
  }
  console.log('  ✓ Verified: Shakshi only sees approved payment pending card. ZERO rejected banners shown!');

  // Step 5: Verify Candidate Wallet for Rejected Guest (Karan)
  console.log('\n▶ Step 5: Verifying Candidate Wallet for Rejected Guest (Karan)');
  const walletKaranRes = await fetch(`${API_BASE}/credentials/my-pass?query=${karanPhone}`);
  const walletKaranJson = await walletKaranRes.json();
  console.log(`  Karan Cards Count: ${walletKaranJson.data.length}`);
  const karanCard = walletKaranJson.data[0];
  console.log('  Karan Status:', karanCard.registrationStatus, '| isRejected:', karanCard.isRejected);
  console.log('  Karan Rejection Reason:', `"${karanCard.reviewNotes}"`);

  if (!karanCard.isRejected) {
    throw new Error('Karan should be marked as isRejected!');
  }
  if (!karanCard.reviewNotes.includes('Aadhar number is not proper visible')) {
    throw new Error('Karan did not receive individual review note!');
  }
  console.log('  ✓ Verified: Karan receives specific rejection reason and Apply Again action!');

  // Step 6: Process Payment for Shakshi and Mint Active Digital Pass
  console.log('\n▶ Step 6: Processing 100% Online Payment for Shakshi');
  const payRes = await fetch(`${API_BASE}/payments/gateway-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentLinkId: shakshiCard.paymentLinkId,
      method: 'UPI_QR',
      providerReference: `TXN-UPI-${timestamp}`,
      notes: 'UPI Gateway Confirmation',
    }),
  });
  const payJson = await payRes.json();
  console.log('  Payment Status:', payJson.success ? '✓ 201 CONFIRMED' : '✗ FAILED');
  console.log('  Payment Response:', payJson);

  // Step 7: Verify Active Digital Pass in Wallet (Zero Reapply Banner)
  console.log('\n▶ Step 7: Checking Active Digital QR Pass in Wallet for Shakshi');
  const finalWalletRes = await fetch(`${API_BASE}/credentials/my-pass?query=${shakshiPhone}`);
  const finalWalletJson = await finalWalletRes.json();
  const finalCard = finalWalletJson.data[0];
  console.log('  Final Pass Status:', finalCard.registrationStatus);
  console.log('  Has Active Pass:', finalCard.hasActivePass);
  console.log('  Digital Pass Code:', finalCard.credential?.passCode);
  console.log('  Total cards returned for Shakshi:', finalWalletJson.data.length);

  if (!finalCard.hasActivePass || finalCard.isRejected) {
    throw new Error('Shakshi digital pass not active or marked rejected!');
  }

  console.log('\n========================================================================');
  console.log('🎉 GRANULAR REVIEW & CLEAN WALLET FILTERING VERIFICATION PASSED 100%');
  console.log('========================================================================');
}

testPerAttendeeReviewAndWallet().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
