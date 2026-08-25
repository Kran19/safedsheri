const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.aadhaarDocument.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log('DOC:', doc);
  
  const reg = await prisma.registration.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { attendees: { include: { attendee: true } } }
  });
  console.log('REG:', reg.id, 'Original Amount:', reg.amountDue);
  console.log('REG ATTENDEES:', reg.attendees.map(a => a.attendee));
}

main().finally(() => prisma.$disconnect());
