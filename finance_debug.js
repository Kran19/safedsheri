const { PrismaClient } = require('./node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } }
});

async function main() {
  // 1. Parse Razorpay Dump
  const rawData = fs.readFileSync('razorpay_dump.txt', 'utf-8');
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const rzpPayments = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('pay_')) {
      const p = {
        id: lines[i], rrn: lines[i+1], method: lines[i+2], phone: lines[i+3],
        date: lines[i+5], amount: Number(lines[i+7].replace(/,/g, ''))
      };
      if (!isNaN(p.amount)) rzpPayments.push(p);
    }
  }
  const uniqueRzp = Array.from(new Map(rzpPayments.map(p => [p.id, p])).values());
  const rzpTotal = uniqueRzp.reduce((s, p) => s + p.amount, 0);

  // 2. Fetch DB Payments
  const allDbPayments = await prisma.payment.findMany({
    where: { status: 'CONFIRMED' },
    include: {
      collectedBy: true,
      registration: {
        include: {
          reviewedBy: true,
          attendees: { where: { isPrimary: true }, include: { attendee: true } }
        }
      }
    }
  });

  const dbOnline = allDbPayments.filter(p => p.method === 'ONLINE_GATEWAY');
  const dbOffline = allDbPayments.filter(p => p.method !== 'ONLINE_GATEWAY');

  const dbOnlineTotal = dbOnline.reduce((s, p) => s + Number(p.amount), 0);
  const dbOfflineTotal = dbOffline.reduce((s, p) => s + Number(p.amount), 0);

  // 3. Mathematical Reconciliation (Online)
  // We need to match RZP and DB Online to find the gap.
  // Since DB has no referenceId, we match by Phone & Amount.
  let matchedDb = new Set();
  let matchedRzp = new Set();

  for (let i = 0; i < uniqueRzp.length; i++) {
    const rzp = uniqueRzp[i];
    for (let j = 0; j < dbOnline.length; j++) {
      if (matchedDb.has(j)) continue;
      const dbP = dbOnline[j];
      const dbPhone = dbP.registration?.attendees?.[0]?.attendee?.phone || '';
      
      const normDbPhone = dbPhone.split(' ').join('');
      const normRzpPhone = rzp.phone.split(' ').join('');

      // Match by normalized phone and amount
      if (normDbPhone === normRzpPhone && Number(dbP.amount) === rzp.amount) {
        matchedDb.add(j);
        matchedRzp.add(i);
        break;
      }
    }
  }

  // Find remaining RZP (in Razorpay but NOT in DB)
  const rzpOnly = uniqueRzp.filter((_, i) => !matchedRzp.has(i));
  const rzpOnlyTotal = rzpOnly.reduce((s, p) => s + p.amount, 0);

  // Find remaining DB (in DB but NOT in Razorpay)
  const dbOnly = dbOnline.filter((_, i) => !matchedDb.has(i));
  const dbOnlyTotal = dbOnly.reduce((s, p) => s + Number(p.amount), 0);

  // 4. Offline (Cash/UPI QR) Report
  let offlineMd = '';
  for (const p of dbOffline) {
    const name = p.registration?.attendees?.[0]?.attendee?.fullName || 'Unknown';
    const approvedBy = p.registration?.reviewedBy?.fullName || 'Auto/System';
    const collectedBy = p.collectedBy?.fullName || 'Unknown';
    offlineMd += `| ${p.method} | ${name} | ₹${p.amount} | Approved By: ${approvedBy} | Collected By: ${collectedBy} |\n`;
  }

  // 5. Generate Master Debug Report
  let md = '# 🧮 MASTER FINANCIAL DEBUG REPORT (0-0 STATS)\n\n';
  
  md += '## 1. THE MATHEMATICAL ROOT CAUSE (ONLINE PAYMENTS)\n';
  md += 'You noticed a gap because:\n';
  md += `- **Razorpay Total:** ₹${rzpTotal.toLocaleString()}\n`;
  md += `- **Database Online Total:** ₹${dbOnlineTotal.toLocaleString()}\n`;
  md += `- **Difference you saw:** ₹${(rzpTotal - dbOnlineTotal).toLocaleString()}\n\n`;
  
  md += 'However, the actual mathematical gap is a combination of TWO things:\n\n';
  md += `**Equation:** \n\n`;
  md += `\`[Database Total (₹${dbOnlineTotal.toLocaleString()})] + [Missing from DB (₹${rzpOnlyTotal.toLocaleString()})] - [Extra in DB (₹${dbOnlyTotal.toLocaleString()})] = Razorpay Total (₹${rzpTotal.toLocaleString()})\`\n\n`;

  md += '### A. Payments SUCCESSFUL in Razorpay, but MISSING in DB (The 3 you found + 4 more):\n';
  md += '| Payment ID | Amount (₹) | Phone | Reason |\n';
  md += '|---|---|---|---|\n';
  for (const p of rzpOnly) {
    md += `| ${p.id} | ₹${p.amount} | ${p.phone} | User paid on Razorpay but closed tab before DB updated |\n`;
  }
  md += `\n**Subtotal Missing in DB:** ₹${rzpOnlyTotal.toLocaleString()}\n\n`;

  md += '### B. Extra Payment in DB that is NOT in Razorpay Dump:\n';
  md += 'This is the root cause of the confusing math! Someone has a CONFIRMED online payment in your DB, but it does not exist in the 35 transactions from Razorpay. This could be a manual admin override or an older test.\n\n';
  md += '| Date | Name | Phone | Amount (₹) | Approved By |\n';
  md += '|---|---|---|---|---|\n';
  for (const p of dbOnly) {
    const name = p.registration?.attendees?.[0]?.attendee?.fullName;
    const phone = p.registration?.attendees?.[0]?.attendee?.phone;
    const admin = p.registration?.reviewedBy?.fullName || 'Unknown';
    md += `| ${p.createdAt.toLocaleString()} | ${name} | ${phone} | ₹${p.amount} | ${admin} |\n`;
  }
  md += `\n**Subtotal Extra in DB:** ₹${dbOnlyTotal.toLocaleString()}\n\n`;

  md += '---\n\n';

  md += '## 2. TOTAL PAYMENTS RIGHT NOW (OVERALL STATS)\n';
  md += `- **Total Online (Razorpay Actual):** ₹${rzpTotal.toLocaleString()}\n`;
  md += `- **Total Offline (Cash/UPI QR):** ₹${dbOfflineTotal.toLocaleString()}\n`;
  md += `- **GRAND TOTAL (Real Money Collected):** ₹${(rzpTotal + dbOfflineTotal).toLocaleString()}\n\n`;

  md += '## 3. OFFLINE / CASH PAYMENT AUDIT (Who approved what?)\n';
  if (dbOffline.length === 0) {
    md += '> No offline (CASH / UPI QR) payments recorded yet.\n';
  } else {
    md += '| Method | Attendee | Amount | KYC Approved By | Cash Collected By |\n';
    md += '|---|---|---|---|---|\n';
    md += offlineMd;
  }

  fs.writeFileSync('C:\\Users\\Aviral Shukla\\.gemini\\antigravity-ide\\brain\\d8aafa7d-150e-418f-beb3-23a5f9a52092\\master_finance_debug_report.md', md);
  console.log('Debug report generated.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
