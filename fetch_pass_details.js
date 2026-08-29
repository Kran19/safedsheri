const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@200.97.161.91:5432/safedsheri?schema=public' } }
});

async function main() {
  const attendees = await prisma.attendee.findMany({
    where: { phone: { contains: '9879572880' } },
    include: {
      registrations: {
        include: {
          registration: {
            include: {
              payments: true,
              attendees: { include: { attendee: true } }
            }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(attendees, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
