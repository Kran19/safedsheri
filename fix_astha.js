const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const astha = await prisma.registration.findUnique({
    where: { registrationNumber: 'SS-2026-000352' },
    include: { payments: true }
  });
  if (astha && astha.payments.length > 0) {
    await prisma.payment.update({
      where: { id: astha.payments[0].id },
      data: { providerReference: 'pay_ASTHA_FIXED' }
    });
    console.log('Fixed Astha again');
  }
}
main().finally(() => prisma.$disconnect());
