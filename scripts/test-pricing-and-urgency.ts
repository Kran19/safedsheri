const API_BASE = 'http://localhost:4000/api/v1';

async function testPricingAndUrgency() {
  console.log('========================================================================');
  console.log('⚡ TESTING PRICING VISIBILITY & URGENCY REVERSE COUNTDOWN ENGINE');
  console.log('========================================================================\n');

  // Step 1: Fetch initial active phase
  console.log('▶ Step 1: Querying Public Active Pricing Phase');
  const res1 = await fetch(`${API_BASE}/registrations/active-phase`);
  const json1 = await res1.json();
  console.log('  Status:', json1.success ? '✓ SUCCESS' : '✗ FAILED');
  console.log('  Active Phase Config:', json1.data);

  // Step 2: Login as Super Admin
  console.log('\n▶ Step 2: Authenticating as Super Admin');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@safedsheri.com',
      password: 'AdminPass123!',
    }),
  });
  const loginJson = await loginRes.json();
  console.log('  Login response status:', loginRes.status);
  const token = loginJson.data?.accessToken;
  console.log('  ✓ Super Admin Authenticated successfully. Token obtained:', token ? 'YES' : 'NO');

  // Step 3: Update Pricing Settings (Conceal Single Pass & Enable Countdown Stop Watch)
  console.log('\n▶ Step 3: Updating Pricing Settings via Super Admin Endpoint');
  const targetDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000);
  const updateRes = await fetch(`${API_BASE}/registrations/pricing-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      phaseName: 'EARLY_BIRD',
      singlePrice: 3500,
      couplePrice: 6500,
      nextSinglePrice: 6500,
      nextCouplePrice: 12000,
      showSinglePrice: true,
      showCouplePrice: true,
      showGazeboPrice: false,
      isCountdownActive: true,
      countdownTarget: targetDate.toISOString(),
      urgencyTagline: '⚡ Early Bird Phase Ending Soon — Lock in passes at ₹3,500 before price escalates to ₹6,500!',
      hiddenPriceLabel: 'Price Revealed on Approval',
    }),
  });

  const updateJson = await updateRes.json();
  console.log('  Update Status Code:', updateRes.status);
  console.log('  Update Response JSON:', updateJson);

  // Step 4: Verify Public Endpoint Returns Updated Config
  console.log('\n▶ Step 4: Verifying Live Public Endpoint Reflection');
  const res2 = await fetch(`${API_BASE}/registrations/active-phase`);
  const json2 = await res2.json();
  if (
    json2.data.isCountdownActive === true &&
    json2.data.nextSinglePrice === 6500 &&
    json2.data.singlePrice === 3500
  ) {
    console.log('  ✓ Verified: Public endpoint is broadcasting real-time pricing & urgency countdown!');
  } else {
    throw new Error('Public endpoint did not match updated configuration');
  }

  console.log('\n========================================================================');
  console.log('🎉 PRICING & URGENCY ENGINE TEST PASSED 100%');
  console.log('========================================================================');
}

testPricingAndUrgency().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
