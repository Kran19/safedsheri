const testPrismaQueryRaw = async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    let reg = await prisma.registration.findFirst();
    if (!reg) return;
    
    // Simulate what happens in confirmGatewayPayment
    const lockedRows = await prisma.$queryRaw`SELECT "amountDue" FROM "Registration" WHERE id = ${reg.id}`;
    const amountDue = lockedRows[0].amountDue;
    
    console.log('Type of amountDue:', typeof amountDue, amountDue.constructor?.name);
    console.log('Value:', amountDue);
    
    // Try to create a payment with this value
    const p = await prisma.payment.create({
      data: {
        registrationId: reg.id,
        amount: amountDue,
        method: 'CASH',
        status: 'PENDING',
        receiptNumber: 'test-raw-123',
        provider: 'test',
        providerReference: 'test',
        paymentLinkId: 'test2'
      }
    });
    console.log('Created successfully');
    await prisma.payment.delete({ where: { id: p.id } });
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
};
testPrismaQueryRaw();
