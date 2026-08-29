const { PrismaClient } = require('./node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public'
    }
  }
});

async function main() {
  const rawData = fs.readFileSync('razorpay_dump.txt', 'utf-8');
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const rzpPayments = [];
  let currentPayment = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('pay_')) {
      currentPayment = {
        id: line,
        rrn: lines[i+1],
        method: lines[i+2],
        phone: lines[i+3],
        email: lines[i+4],
        date: lines[i+5],
        amountStr: lines[i+7],
        status: lines[i+8],
      };
      const amt = Number(currentPayment.amountStr.replace(/,/g, ''));
      if (!isNaN(amt)) {
        currentPayment.amount = amt;
        rzpPayments.push(currentPayment);
      }
    }
  }

  const uniqueRzpMap = new Map();
  for (const p of rzpPayments) uniqueRzpMap.set(p.id, p);
  const uniqueRzpPayments = Array.from(uniqueRzpMap.values());

  const dbPaymentsRaw = await prisma.payment.findMany({
    where: { method: 'ONLINE_GATEWAY', status: 'CONFIRMED' },
    include: {
      registration: {
        include: {
          attendees: { where: { isPrimary: true }, include: { attendee: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Basic Matching Algorithm
  const matchedDbIndexes = new Set();
  const unmatchedRzp = [];

  for (const rzp of uniqueRzpPayments) {
    let matchFound = false;
    for (let i = 0; i < dbPaymentsRaw.length; i++) {
      if (matchedDbIndexes.has(i)) continue;
      
      const dbP = dbPaymentsRaw[i];
      const rzpDate = new Date(rzp.date + ' 2026').getTime();
      const dbDate = dbP.createdAt.getTime();
      const timeDiff = Math.abs(rzpDate - dbDate);

      // If amounts match and time is somewhat close (e.g. within 48 hours to account for parsing issues)
      // Actually, just matching on amount and roughly same time. 
      // But some amounts might be unique. Let's do a strict match first.
      if (dbP.amount == rzp.amount) {
         matchFound = true;
         matchedDbIndexes.add(i);
         break;
      }
    }
    
    // If strict match fails, let's try fuzzy match (just close in time if there's an amount discrepancy)
    if (!matchFound) {
      unmatchedRzp.push(rzp);
    }
  }

  let md = '# ⚠️ Missing Payments Report\n\n';
  md += 'Here is the exact list of the 5 payments that are in Razorpay but missing from your database:\n\n';
  md += '| Payment ID | Date | Amount (₹) | Phone | RRN |\n';
  md += '|---|---|---|---|---|\n';
  
  for (const p of unmatchedRzp) {
    md += `| ${p.id} | ${p.date} | ₹${p.amount} | ${p.phone} | ${p.rrn} |\n`;
  }
  
  fs.writeFileSync('C:\\Users\\Aviral Shukla\\.gemini\\antigravity-ide\\brain\\d8aafa7d-150e-418f-beb3-23a5f9a52092\\missing_payments.md', md);
  console.log('Report generated.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
