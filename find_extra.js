const fs = require('fs');
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const txt = fs.readFileSync('razorpay_dump_new.txt', 'utf8');
  const lines = txt.split('\n').map(l => l.trim());
  const rzpIds = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('pay_')) {
      let status = lines[i + 8];
      if (status === 'Captured') {
        rzpIds.push(lines[i]);
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

  console.log('EXTRA DB PAYMENTS NOT IN NEW DUMP:');
  let extraTotal = 0;
  for (const dp of dbPayments) {
    if (dp.providerReference.startsWith('pay_') && !rzpIds.includes(dp.providerReference)) {
      const name = dp.registration?.attendees[0]?.attendee?.fullName || 'Unknown';
      console.log(`- ${dp.providerReference} (${name}): ₹${dp.amount}`);
      extraTotal += Number(dp.amount);
    }
  }
  console.log('TOTAL EXTRA:', extraTotal);
}
main().finally(() => prisma.$disconnect());
