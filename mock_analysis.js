const fs = require('fs');
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const txt = fs.readFileSync('razorpay_dump_new.txt', 'utf8');
  const lines = txt.split('\n').map(l => l.trim());
  const rzpPayments = [];
  
  let totalCaptured = 0;
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
            totalCaptured += amt;
          }
        }
      }
    }
  }

  let report = `# Razorpay vs Database Mock Analysis\n\n`;
  report += `**NEW Razorpay Dump Total (Captured Only):** ₹${totalCaptured}\n`;
  report += `**Total Captured Transactions in Dump:** ${rzpPayments.length}\n\n`;

  report += `## Analysis of Missing/Pending DB Records\n`;
  report += `The following users have "Captured" payments in your new Razorpay dump. We checked the Database to see if they are missing or still pending.\n\n`;
  
  report += `| Razorpay ID | Phone Number | Dump Amount (₹) | Database Status |\n`;
  report += `|---|---|---|---|\n`;

  let pendingFound = 0;
  let missingFound = 0;

  for (const rp of rzpPayments) {
    const phoneClean = rp.phone.replace(/\D/g, '').slice(-10);
    
    // Check if payment ID already exists and is CONFIRMED
    const existingPayment = await prisma.payment.findFirst({
      where: { providerReference: rp.id }
    });

    if (existingPayment && existingPayment.status === 'CONFIRMED') {
      // It's already fine
      continue;
    }

    // If not found by payment ID, look for the attendee by phone
    const attendee = await prisma.attendee.findFirst({
      where: { phone: { contains: phoneClean } },
      include: {
        registrations: {
          include: {
            registration: {
              include: { payments: true }
            }
          }
        }
      }
    });

    if (attendee) {
      let foundPending = false;
      for (const r of attendee.registrations) {
        const reg = r.registration;
        for (const p of reg.payments) {
          if (p.status === 'PENDING') {
            foundPending = true;
            report += `| ${rp.id} | ${rp.phone} | ₹${rp.amount} | ⚠️ **PENDING in DB** (${attendee.fullName}) |\n`;
            pendingFound++;
            break;
          } else if (p.status === 'CONFIRMED' && p.providerReference?.startsWith('ADMIN-MANUAL')) {
            foundPending = true;
            report += `| ${rp.id} | ${rp.phone} | ₹${rp.amount} | 🛠️ **MANUAL OVERRIDE in DB** (${attendee.fullName}) |\n`;
            pendingFound++;
            break;
          }
        }
        if (foundPending) break;
      }
      
      if (!foundPending) {
        report += `| ${rp.id} | ${rp.phone} | ₹${rp.amount} | ❌ **USER EXISTS, BUT NO PAYMENT RECORD** (${attendee.fullName}) |\n`;
        missingFound++;
      }
    } else {
      report += `| ${rp.id} | ${rp.phone} | ₹${rp.amount} | ❌ **COMPLETELY MISSING FROM DB** |\n`;
      missingFound++;
    }
  }
  
  report += `\n**Summary:**\n`;
  report += `- Found **${pendingFound}** users who paid in Razorpay but are currently marked as PENDING or ADMIN-MANUAL in the DB.\n`;
  report += `- Found **${missingFound}** payments in Razorpay that don't have matching user records in the DB at all.\n`;

  fs.writeFileSync('new_analysis_report.md', report);
  console.log('Report generated at new_analysis_report.md');

}

main().finally(() => prisma.$disconnect());
