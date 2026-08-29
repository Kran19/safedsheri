const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const updates = [
    { reg: 'SS-2026-000271', ref: 'ADMIN-MANUAL-F02CE5' }, // Richa
    { reg: 'SS-2026-000337', ref: 'ADMIN-MANUAL-D0C01A' }, // Kakadiya
    { reg: 'SS-2026-000225', ref: 'ADMIN-MANUAL-B1N1T4' }, // Binita
    { reg: 'SS-2026-000215', ref: 'ADMIN-MANUAL-V1DH1K' }, // Vidhi
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
      console.log(`Reverted ${u.reg} to ${u.ref}`);
    }
  }

  // Jalpa
  const jalpa = await prisma.attendee.findMany({
    where: { fullName: { contains: 'Jalpa', mode: 'insensitive' } },
    include: { registrations: { include: { registration: { include: { payments: true } } } } }
  });
  if (jalpa.length > 0) {
    for (const a of jalpa) {
      for (const r of a.registrations) {
        if (r.registration.payments.length > 0) {
          const p = r.registration.payments[0];
          if (p.providerReference === 'pay_TUlyY9BEEOrQgK') {
            await prisma.payment.update({
              where: { id: p.id },
              data: { providerReference: 'ADMIN-MANUAL-269F8F' }
            });
            console.log('Reverted Jalpa to ADMIN-MANUAL-269F8F');
          }
        }
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
