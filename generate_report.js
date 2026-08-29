const fs = require('fs');
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const txt = fs.readFileSync('razorpay_dump.txt', 'utf8');
  const lines = txt.split('\n').map(l => l.trim());
  const rzpPayments = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('pay_')) {
      // Find the amount above it
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

  // Get DB online actuals (not starting with ADMIN-MANUAL)
  const dbPayments = await prisma.payment.findMany({
    where: { 
      status: 'CONFIRMED', 
      method: 'ONLINE_GATEWAY',
      NOT: { providerReference: { startsWith: 'ADMIN-MANUAL' } }
    },
    include: {
      registration: {
        include: { attendees: { include: { attendee: true } } }
      }
    }
  });

  const rzpIds = rzpPayments.map(p => p.id);
  const dbIds = dbPayments.map(p => p.providerReference).filter(id => id && id.startsWith('pay_'));
  
  let report = `# Razorpay vs Database Discrepancy Report\n\n`;
  report += `**Razorpay Actual in DB:** ₹1,40,900\n`;
  report += `**Razorpay Total in Dump:** ₹1,42,702\n\n`;
  
  report += `The difference exists because the Database is **MISSING** some payments that are in the Razorpay dump, while simultaneously having **EXTRA** payments that are NOT in the Razorpay dump.\n\n`;

  report += `## 1. Missing from Database (Successful in Razorpay, but webhook failed)\n`;
  report += `These payments exist in your Razorpay dashboard, but are NOT in the Database's "Razorpay Actual".\n\n`;
  
  let missingTotal = 0;
  report += `| Razorpay ID | Amount (₹) |\n|---|---|\n`;
  for (const rp of rzpPayments) {
    if (!dbIds.includes(rp.id) && rp.id !== 'pay_TUlyY9BEEOrQgK' && rp.id !== 'pay_TUiRk896vBhd7l' && rp.id !== 'pay_TUfqrGNa7YPckh') {
      // Exclude Jalpa, Binita, Vidhi if they were manually handled
      // Actually let's just do a strict comparison
      const foundInDb = dbPayments.find(dp => dp.providerReference === rp.id);
      if (!foundInDb) {
        report += `| ${rp.id} | ₹${rp.amount} |\n`;
        missingTotal += rp.amount;
      }
    }
  }
  report += `**Total Missing from DB:** ₹${missingTotal}\n\n`;

  report += `## 2. Extra in Database (In DB, but not in Razorpay Dump)\n`;
  report += `These payments are currently counted in the **₹1,40,900** DB total, but they are MISSING from the text file dump you provided. This could be because they are newer payments, or they were manually overridden to look like Razorpay payments.\n\n`;
  
  let extraTotal = 0;
  report += `| Razorpay ID / Ref | Attendee Name | Amount (₹) |\n|---|---|---|\n`;
  for (const dp of dbPayments) {
    if (!rzpIds.includes(dp.providerReference)) {
      const name = dp.registration?.attendees[0]?.attendee?.fullName || 'Unknown';
      report += `| ${dp.providerReference} | ${name} | ₹${dp.amount} |\n`;
      extraTotal += Number(dp.amount);
    }
  }
  report += `**Total Extra in DB:** ₹${extraTotal}\n\n`;

  report += `## Summary Math\n`;
  report += `\`[Razorpay Dump] - [Missing from DB] + [Extra in DB] = [DB Razorpay Actual]\`\n`;
  report += `\`1,42,702 - ${missingTotal} + ${extraTotal} = ${142702 - missingTotal + extraTotal}\`\n\n`;

  fs.writeFileSync('discrepancy_report.md', report);
  console.log('Report generated at discrepancy_report.md');
}

main().finally(() => prisma.$disconnect());
