const fs = require('fs');
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const txt = fs.readFileSync('razorpay_dump_new.txt', 'utf8');
  const lines = txt.split('\n').map(l => l.trim());
  const rzpPayments = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('pay_')) {
      let status = lines[i + 8];
      if (status === 'Captured') {
        let amtStr = lines[i + 7];
        if (amtStr) {
          amtStr = amtStr.replace(/,/g, '');
          const amt = parseFloat(amtStr);
          if (!isNaN(amt)) {
            rzpPayments.push({ id: lines[i], phone: lines[i + 3], amount: amt });
          }
        }
      }
    }
  }

  const dbPayments = await prisma.payment.findMany({
    where: { 
      status: 'CONFIRMED', 
      method: 'ONLINE_GATEWAY',
      NOT: { providerReference: { startsWith: 'ADMIN-MANUAL' } }
    },
    include: { registration: { include: { attendees: { include: { attendee: true } } } } }
  });

  const rzpIds = rzpPayments.map(p => p.id);
  const dbIds = dbPayments.map(p => p.providerReference).filter(id => id && id.startsWith('pay_'));
  
  let rzpTotal = rzpPayments.reduce((sum, p) => sum + p.amount, 0);
  let dbTotal = dbPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  console.log(`Razorpay Dump Total: ${rzpTotal}`);
  console.log(`DB Actual Total: ${dbTotal}`);

  console.log('\n--- Missing from DB ---');
  let missingTotal = 0;
  for (const rp of rzpPayments) {
    if (!dbIds.includes(rp.id)) {
      console.log(`${rp.id} (₹${rp.amount})`);
      missingTotal += rp.amount;
    }
  }
  console.log(`Missing sum: ${missingTotal}`);

  console.log('\n--- Extra in DB ---');
  let extraTotal = 0;
  for (const dp of dbPayments) {
    if (dp.providerReference.startsWith('pay_') && !rzpIds.includes(dp.providerReference)) {
      console.log(`${dp.providerReference} (₹${dp.amount})`);
      extraTotal += Number(dp.amount);
    }
  }
  console.log(`Extra sum: ${extraTotal}`);

}
main().finally(() => prisma.$disconnect());
