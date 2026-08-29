const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } } });

async function main() {
  const phones = ['9426936148', '9723611790', '8780230805', '8460609656', '6359120081', '7265098626'];
  for (const phone of phones) {
    const attendees = await prisma.attendee.findMany({
      where: { phone: { contains: phone } },
      include: {
        registrations: {
          include: {
            registration: { include: { payments: true } }
          }
        }
      }
    });
    console.log(`\nPhone ${phone}: found ${attendees.length}`);
    for (const a of attendees) {
      console.log(`Attendee: ${a.fullName}`);
      for (const r of a.registrations) {
        const reg = r.registration;
        console.log(`  Reg: ${reg.registrationNumber}, Status: ${reg.status}`);
        for (const p of reg.payments) {
          console.log(`    Payment: ${p.amount}, Method: ${p.method}, Status: ${p.status}, Ref: ${p.providerReference}`);
        }
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
