const fs = require('fs');
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const txt = fs.readFileSync('razorpay_dump.txt', 'utf8');
  const lines = txt.split('\n').map(l => l.trim());
  const rzpPayments = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('pay_')) {
      // The amount is usually exactly 4 lines above the pay_ id
      let amtStr = lines[i - 4];
      if (amtStr) {
        amtStr = amtStr.replace(/,/g, '');
        const amt = parseFloat(amtStr);
        if (!isNaN(amt)) {
          rzpPayments.push({ id: lines[i], amount: amt });
        }
      }
    }
  }

  // Get DB online actuals
  const dbPayments = await prisma.payment.findMany({
    where: { 
      status: 'CONFIRMED', 
      method: 'ONLINE_GATEWAY',
      NOT: { providerReference: { startsWith: 'ADMIN-MANUAL' } }
    },
    select: { providerReference: true, amount: true }
  });

  const rzpIds = rzpPayments.map(p => p.id);
  const dbIds = dbPayments.map(p => p.providerReference).filter(id => id && id.startsWith('pay_'));
  
  let rzpTotal = rzpPayments.reduce((acc, curr) => acc + curr.amount, 0);
  let dbTotal = dbPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  console.log(`Razorpay Dump Total Amount: ₹${rzpTotal}`);
  console.log(`DB Razorpay Actual Total Amount: ₹${dbTotal}`);
  console.log(`Difference: ₹${rzpTotal - dbTotal}`);

  console.log('\n--- In Razorpay Dump but NOT in DB (Missing from DB) ---');
  for (const rp of rzpPayments) {
    if (!dbIds.includes(rp.id)) {
      console.log(`- ${rp.id} (₹${rp.amount})`);
    }
  }

  console.log('\n--- In DB but NOT in Razorpay Dump (Extra in DB) ---');
  for (const dp of dbPayments) {
    if (dp.providerReference && dp.providerReference.startsWith('pay_') && !rzpIds.includes(dp.providerReference)) {
      console.log(`- ${dp.providerReference} (₹${dp.amount})`);
    }
  }
}

main().finally(() => prisma.$disconnect());
