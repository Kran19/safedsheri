import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const attendees = await prisma.attendee.findMany({
    where: {
      OR: [
        { fullName: { contains: 'Meghana', mode: 'insensitive' } },
        { phone: { contains: '9033582433' } },
      ]
    },
    include: {
      registrations: {
        include: {
          registration: true
        }
      }
    }
  });

  console.dir(attendees, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
