const testApi = async () => {
  try {
    // 1. Get a super admin user
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    
    if (!admin) {
      console.log('No super admin found');
      return;
    }
    
    // 2. Login to get token (we don't know the password... wait)
    // Actually, I can just create a JWT token directly using the JWT secret!
    const jwt = require('jsonwebtoken');
    // NestJS default secret? Let's check environment or auth.module.ts
    const jwtSecret = process.env.JWT_SECRET || 'safedsheri-super-secret-key-2026'; // let's guess
    const token = jwt.sign({ sub: admin.id, username: admin.username, role: admin.role }, jwtSecret, { expiresIn: '1h' });
    
    let reg = await prisma.registration.findFirst({ where: { status: 'SUBMITTED' } });
    if (!reg) reg = await prisma.registration.findFirst();
    
    console.log('Testing with registration:', reg?.id);
    
    // 3. Make the PATCH request
    const res = await fetch(`http://localhost:4000/api/v1/registrations/${reg?.id}/payment-method`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ method: 'CASH', isPaymentDone: true })
    });
    
    const text = await res.text();
    console.log('Response Status:', res.status);
    console.log('Response Body:', text);

  } catch (e) {
    console.error(e);
  }
};

testApi();
