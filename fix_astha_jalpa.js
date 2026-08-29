const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  // Revert Astha
  const astha = await prisma.registration.findUnique({
    where: { registrationNumber: 'SS-2026-000352' },
    include: { payments: true }
  });
  if (astha && astha.payments.length > 0) {
    await prisma.payment.update({
      where: { id: astha.payments[0].id },
      data: { providerReference: 'ADMIN-MANUAL-D65034' }
    });
    console.log('Reverted Astha to ADMIN-MANUAL');
  }

  // Find Jalpa
  const jalpa = await prisma.attendee.findMany({
    where: { fullName: { contains: 'Jalpa', mode: 'insensitive' } },
    include: { registrations: { include: { registration: { include: { payments: true } } } } }
  });
  if (jalpa.length > 0) {
    for (const a of jalpa) {
      console.log(`Found Jalpa: ${a.fullName}`);
      for (const r of a.registrations) {
        if (r.registration.payments.length > 0) {
          const p = r.registration.payments[0];
          console.log(`Current provider ref: ${p.providerReference}`);
          if (p.providerReference && p.providerReference.startsWith('ADMIN-MANUAL')) {
            await prisma.payment.update({
              where: { id: p.id },
              data: { providerReference: 'pay_TUlyY9BEEOrQgK' }
            });
            console.log('Updated Jalpa to pay_TUlyY9BEEOrQgK');
          }
        }
      }
    }
  } else {
    console.log('Jalpa not found in DB');
  }
}

main().finally(() => prisma.$disconnect());
