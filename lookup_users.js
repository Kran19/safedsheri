const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  // 1. Update Astha to her real Razorpay ID
  const astha = await prisma.registration.findUnique({
    where: { registrationNumber: 'SS-2026-000352' },
    include: { payments: true }
  });
  if (astha && astha.payments.length > 0) {
    await prisma.payment.update({
      where: { id: astha.payments[0].id },
      data: { providerReference: 'pay_TVWK9vmJDhOlzR' }
    });
    console.log('✅ Re-synced Astha to Razorpay Actual (pay_TVWK9vmJDhOlzR)');
  }

  // 2. Lookup 8780230805
  console.log('\n--- Looking up 8780230805 (Kakadiya) ---');
  const kakadiya = await prisma.attendee.findMany({
    where: { phone: { contains: '8780230805' } },
    include: { registrations: { include: { registration: { include: { payments: true } } } } }
  });
  if (kakadiya.length > 0) {
    for (const a of kakadiya) {
      console.log(`Name: ${a.fullName}`);
      for (const r of a.registrations) {
        console.log(`Reg ID: ${r.registration.registrationNumber}`);
        for (const p of r.registration.payments) {
          console.log(`- Payment: ₹${p.amount} | Status: ${p.status} | Ref: ${p.providerReference}`);
        }
      }
    }
  } else {
    console.log('No user found for 8780230805');
  }

  // 3. Lookup 9426936148
  console.log('\n--- Looking up 9426 936148 ---');
  const user1 = await prisma.attendee.findMany({
    where: { phone: { contains: '9426936148' } }
  });
  if (user1.length > 0) {
    console.log(`Found: ${JSON.stringify(user1)}`);
  } else {
    console.log('No user found in DB for 9426936148');
  }

  // 4. Lookup 8460609656
  console.log('\n--- Looking up 8460 609656 ---');
  const user2 = await prisma.attendee.findMany({
    where: { phone: { contains: '8460609656' } }
  });
  if (user2.length > 0) {
    console.log(`Found: ${JSON.stringify(user2)}`);
  } else {
    console.log('No user found in DB for 8460609656');
  }
}
main().finally(() => prisma.$disconnect());
