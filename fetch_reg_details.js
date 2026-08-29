const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } }
});

async function main() {
  const regs = await prisma.registration.findMany({
    where: { registrationNumber: { in: ['SS-2026-000225', 'SS-2026-000285', 'SS-2026-000215'] } },
    include: {
      payments: true,
      reviewedBy: { select: { fullName: true } },
      attendees: {
        include: { attendee: true }
      }
    }
  });

  console.log(JSON.stringify(regs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
