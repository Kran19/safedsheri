const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const updates = [
    { reg: 'SS-2026-000352', ref: 'ADMIN-MANUAL-D65034', name: 'Astha' }, // Revert to Manual
    { reg: 'SS-2026-000271', ref: 'pay_TVUOht5EMv9uhH', name: 'Richa' }, // Move to Razorpay
    { reg: 'SS-2026-000337', ref: 'pay_TVUZqUr4jNr4EE', name: 'Kakadiya' } // Move to Razorpay
  ];

  for (const u of updates) {
    const reg = await prisma.registration.findUnique({
      where: { registrationNumber: u.reg },
      include: { payments: true }
    });
    if (reg && reg.payments.length > 0) {
      await prisma.payment.update({
        where: { id: reg.payments[0].id },
        data: { providerReference: u.ref }
      });
      console.log(`Updated ${u.name} (${u.reg}) to ${u.ref}`);
    }
  }

  // Handle Jalpa (has no known SS-reg ID, find by name)
  const jalpa = await prisma.attendee.findMany({
    where: { fullName: { contains: 'Jalpa', mode: 'insensitive' } },
    include: { registrations: { include: { registration: { include: { payments: true } } } } }
  });
  if (jalpa.length > 0) {
    for (const a of jalpa) {
      for (const r of a.registrations) {
        if (r.registration.payments.length > 0) {
          const p = r.registration.payments[0];
          if (p.providerReference?.startsWith('ADMIN-MANUAL')) {
            await prisma.payment.update({
              where: { id: p.id },
              data: { providerReference: 'pay_TUlyY9BEEOrQgK' }
            });
            console.log(`Updated Jalpa to pay_TUlyY9BEEOrQgK`);
          }
        }
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
