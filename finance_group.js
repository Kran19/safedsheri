const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } }
});

async function main() {
  const payments = await prisma.payment.findMany({
    where: { status: 'CONFIRMED' },
    select: { method: true, amount: true, providerReference: true }
  });

  const stats = {};
  for (const p of payments) {
    const key = `${p.method} | ${p.providerReference?.startsWith('ADMIN-MANUAL') ? 'MANUAL' : 'ACTUAL'}`;
    if (!stats[key]) stats[key] = { count: 0, total: 0 };
    stats[key].count++;
    stats[key].total += Number(p.amount);
  }

  console.table(stats);
}

main().catch(console.error).finally(() => prisma.$disconnect());
