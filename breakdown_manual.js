const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const p = await prisma.payment.findMany({
    where: { 
      status: 'CONFIRMED', 
      method: 'ONLINE_GATEWAY', 
      providerReference: { startsWith: 'ADMIN-MANUAL' } 
    },
    include: { registration: { include: { attendees: { include: { attendee: true } } } } }
  });
  console.log('MANUAL UPI ENTRIES:');
  let total = 0;
  p.forEach(x => {
    const name = x.registration?.attendees[0]?.attendee?.fullName || 'Unknown';
    console.log(`- ${name}: ₹${x.amount}`);
    total += Number(x.amount);
  });
  console.log('TOTAL:', total);
}
main().finally(() => prisma.$disconnect());
