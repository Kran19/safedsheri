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

  console.log(`NEW Razorpay Dump Total (Captured Only): ₹${totalCaptured}`);
  console.log(`Total Captured Transactions: ${rzpPayments.length}`);

  // Now, check against DB for pending or missing
  console.log('\n--- Checking against DB ---');
  let fixedCount = 0;
  for (const rp of rzpPayments) {
    // Search DB by phone number or payment id
    const phoneClean = rp.phone.replace(/\D/g, '').slice(-10);

    // Check if payment ID already exists and is CONFIRMED
    const existingPayment = await prisma.payment.findFirst({
      where: { providerReference: rp.id }
    });

    if (existingPayment && existingPayment.status === 'CONFIRMED') {
      // All good
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
          // If they have a pending online payment, or a manual confirmed payment
          if (p.status === 'PENDING' || (p.status === 'CONFIRMED' && p.providerReference?.startsWith('ADMIN-MANUAL'))) {
            foundPending = true;
            console.log(`Fixing DB for ${attendee.fullName} (${phoneClean}) - Updating to ${rp.id}`);

            await prisma.payment.update({
              where: { id: p.id },
              data: {
                status: 'CONFIRMED',
                providerReference: rp.id,
                method: 'ONLINE_GATEWAY' // Ensure it's online gateway
              }
            });
            // Update registration status to PASS_ISSUED if it was pending
            if (reg.status === 'PAYMENT_PENDING') {
              await prisma.registration.update({
                where: { id: reg.id },
                data: { status: 'PASS_ISSUED' }
              });
            }
            fixedCount++;
            break; // Stop iterating payments for this registration
          }
        }
        if (foundPending) break;
      }

      if (!foundPending) {
        console.log(`Attendee ${attendee.fullName} found but no pending/manual payment to fix for ${rp.id}.`);
      }
    } else {
      console.log(`Could not find any user in DB with phone ${phoneClean} for payment ${rp.id}`);
    }
  }

  console.log(`\nSuccessfully fixed/updated ${fixedCount} records to Razorpay Actual.`);

}

main().finally(() => prisma.$disconnect());
