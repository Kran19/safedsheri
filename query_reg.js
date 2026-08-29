const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const r = await prisma.registration.findUnique({
    where: { registrationNumber: 'SS-2026-000352' },
    include: { attendees: { include: { attendee: true } }, payments: true }
  });
  console.log(JSON.stringify(r, null, 2));
}

main().finally(() => prisma.$disconnect());
