const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const updates = [
    { reg: 'SS-2026-000337', ref: 'pay_TVUZqUr4jNr4EE' }, // Kakadiya
    { reg: 'SS-2026-000271', ref: 'pay_TVUOht5EMv9uhH' }, // Richa
  ];

  for (const u of updates) {
    const reg = await prisma.registration.findUnique({
      where: { registrationNumber: u.reg },
      include: { payments: true }
    });
    
    if (reg && reg.payments.length > 0) {
      const p = reg.payments[0];
      await prisma.payment.update({
        where: { id: p.id },
        data: { providerReference: u.ref }
      });
      console.log(`Updated ${u.reg} payment ${p.id} to ${u.ref}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
