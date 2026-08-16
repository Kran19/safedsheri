import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api/v1';

async function testRejectionReapplyAndSearch() {
  console.log('\n========================================================================');
  console.log('🧪 TESTING REJECTION, RE-APPLY FLOW, MOBILE & AADHAAR SEARCH HIERARCHY');
  console.log('========================================================================\n');

  const rand = Math.floor(1000 + Math.random() * 9000);
  const mobile = `98765${rand}1`; // 10 digits
  const aadhaar = `11223344${rand}`; // 12 digits

  // 1. Initial Registration
  console.log('▶ STEP 1: Initial Single Pass Registration');
  const reg1Res = await fetch(`${API_BASE}/registrations/public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passType: 'SINGLE',
      attendees: [
        {
          fullName: `Kavita Patel ${rand}`,
          phone: `+91${mobile}`,
          gender: 'FEMALE',
          aadhaarNumber: aadhaar,
          documentKey: 'sample_aadhaar.png',
          originalFilename: 'aadhaar_front.jpg',
        },
      ],
    }),
  });
  const reg1Json: any = await reg1Res.json();
  if (!reg1Json.success) throw new Error(`Registration failed: ${reg1Json.message}`);
  const reg1Id = reg1Json.data.id;
  const reg1Number = reg1Json.data.registrationNumber;
  console.log(`  ✓ Application 1 Created: ${reg1Number} (Status: ${reg1Json.data.status})`);

  // 2. Admin Rejects Application 1
  console.log('\n▶ STEP 2: Super Admin Rejection');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@safedsheri.com',
      password: 'AdminPass123!',
    }),
  });
  const loginJson: any = await loginRes.json();
  const token = loginJson.data?.accessToken || loginJson.data?.token;

  const rejectRes = await fetch(`${API_BASE}/registrations/${reg1Id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reason: 'Aadhaar image was blurry. Please re-upload a clear government ID copy.',
    }),
  });
  const rejectJson: any = await rejectRes.json();
  if (!rejectJson.success) throw new Error(`Rejection failed: ${rejectJson.message}`);
  console.log(`  ✓ Application 1 Rejected: Status -> ${rejectJson.data.status}`);

  // 3. Search via Mobile Number
  console.log('\n▶ STEP 3: My Pass Search using Mobile Number (98765 XXXXX)');
  const mobileSearchRes = await fetch(`${API_BASE}/credentials/my-pass?query=${mobile}`);
  const mobileSearchJson: any = await mobileSearchRes.json();
  if (!mobileSearchJson.success || mobileSearchJson.data.length === 0) {
    throw new Error('Mobile search failed to find rejected pass');
  }
  console.log(`  ✓ Record Found via Mobile (${mobile}):`);
  console.log(`    - Application: ${mobileSearchJson.data[0].registrationNumber}`);
  console.log(`    - Status: ${mobileSearchJson.data[0].registrationStatus}`);
  console.log(`    - Review Note: "${mobileSearchJson.data[0].reviewNotes}"`);

  // 4. Search via 12-Digit Aadhaar Number
  console.log('\n▶ STEP 4: My Pass Search using 12-Digit Aadhaar Number (1122 3344 XXXX)');
  const aadhaarSearchRes = await fetch(`${API_BASE}/credentials/my-pass?query=${aadhaar}`);
  const aadhaarSearchJson: any = await aadhaarSearchRes.json();
  if (!aadhaarSearchJson.success || aadhaarSearchJson.data.length === 0) {
    throw new Error('Aadhaar search failed to find record');
  }
  console.log(`  ✓ Record Found via Aadhaar (${aadhaar}):`);
  console.log(`    - Application: ${aadhaarSearchJson.data[0].registrationNumber}`);
  console.log(`    - Masked Aadhaar: ${aadhaarSearchJson.data[0].aadhaarMasked}`);
  console.log(`    - Status: ${aadhaarSearchJson.data[0].registrationStatus}`);

  // 5. Re-apply with same Aadhaar and Mobile (Applying Again)
  console.log('\n▶ STEP 5: Candidate Re-applies with Clearer Document (Apply Again)');
  const reg2Res = await fetch(`${API_BASE}/registrations/public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passType: 'SINGLE',
      attendees: [
        {
          fullName: `Kavita Patel ${rand}`,
          phone: `+91${mobile}`,
          gender: 'FEMALE',
          aadhaarNumber: aadhaar,
          documentKey: 'clean_aadhaar_hd.png',
          originalFilename: 'clear_aadhaar_card.png',
        },
      ],
    }),
  });
  const reg2Json: any = await reg2Res.json();
  if (!reg2Json.success) throw new Error(`Re-application failed: ${reg2Json.message}`);
  const reg2Number = reg2Json.data.registrationNumber;
  console.log(`  ✓ New Application Accepted: ${reg2Number} (Status: ${reg2Json.data.status})`);

  // 6. Search again & verify hierarchy
  console.log('\n▶ STEP 6: Verify My Pass Hierarchy (Active Application at Top)');
  const hierarchySearchRes = await fetch(`${API_BASE}/credentials/my-pass?query=${mobile}`);
  const hierarchySearchJson: any = await hierarchySearchRes.json();
  console.log(`  ✓ Total Applications in Wallet: ${hierarchySearchJson.data.length}`);
  console.log(`    - Top (Latest Active): ${hierarchySearchJson.data[0].registrationNumber} [${hierarchySearchJson.data[0].registrationStatus}]`);
  console.log(`    - Secondary (Previous Rejected): ${hierarchySearchJson.data[1].registrationNumber} [${hierarchySearchJson.data[1].registrationStatus}]`);

  if (hierarchySearchJson.data[0].registrationStatus !== 'UNDER_REVIEW') {
    throw new Error('Hierarchy error: Latest active application should be at the top');
  }

  console.log('\n========================================================================');
  console.log('🎉 REJECTION, RE-APPLY FLOW, MOBILE & AADHAAR SEARCH TEST 100% PASSED!');
  console.log('========================================================================\n');
}

testRejectionReapplyAndSearch().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
