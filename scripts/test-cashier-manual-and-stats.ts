import * as crypto from 'crypto';

const API_BASE = 'http://localhost:4000/api/v1';

async function testCashierManualAndStats() {
  console.log('\n======================================================');
  console.log('🧪 TESTING CASHIER STATS & MANUAL DESK ON-SPOT BOOKING');
  console.log('======================================================\n');

  // 1. Authenticate as Finance Executive
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'cashier1@safedsheri.com', password: 'CashierPass123!' }),
  });
  const loginJson: any = await loginRes.json();
  if (!loginJson.success) throw new Error('Cashier login failed');
  const token = loginJson.data.accessToken;
  console.log(`✓ Authenticated Staff: ${loginJson.data.user.fullName} (${loginJson.data.user.role})`);

  // 2. Fetch Financial Stats
  const statsRes = await fetch(`${API_BASE}/payments/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const statsJson: any = await statsRes.json();
  if (!statsJson.success) throw new Error('Failed to fetch stats');
  console.log(`✓ Financial Stats Retrieved:`);
  console.log(`   - Total Revenue: ₹${statsJson.data.totalVolume.toLocaleString()}`);
  console.log(`   - Today's Collection: ₹${statsJson.data.todayVolume.toLocaleString()}`);
  console.log(`   - Total Transactions: ${statsJson.data.totalTransactions}`);
  console.log(`   - Method Breakdown:`, statsJson.data.methodBreakdown);

  // 3. Create Manual On-Spot Entry (Custom Amount & Custom Method)
  const testAadhaar = `88${crypto.randomBytes(5).toString('hex').slice(0, 10)}`;
  const manualRes = await fetch(`${API_BASE}/payments/manual-entry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      passType: 'SINGLE',
      customAmount: 4200.0, // Custom free-hand price override
      paymentMethod: 'CUSTOM_DIRECT',
      notes: 'VIP walk-in registered on-spot at Box Office Counter',
      attendees: [
        {
          fullName: 'Kajalben Prajapati',
          phone: '+919876599988',
          gender: 'FEMALE',
          aadhaarNumber: '112233445566',
        },
      ],
    }),
  });
  const manualJson: any = await manualRes.json();
  if (!manualJson.success) throw new Error(`Manual entry creation failed: ${manualJson.message}`);
  console.log(`\n✓ On-Spot Manual Entry Created:`);
  console.log(`   - Application: ${manualJson.data.registration.registrationNumber}`);
  console.log(`   - Receipt Number: ${manualJson.data.payment.receiptNumber}`);
  console.log(`   - Settled Amount: ₹${manualJson.data.payment.amount}`);
  console.log(`   - Minted Passes: ${manualJson.data.credentials.length} (Code: ${manualJson.data.credentials[0].passCode})`);

  console.log('\n======================================================');
  console.log('🎉 CASHIER STATS & MANUAL ENTRY TEST 100% PASSED!');
  console.log('======================================================\n');
}

testCashierManualAndStats().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
