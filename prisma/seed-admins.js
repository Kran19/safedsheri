const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🛡️ Auto-Synchronizing Admin & Gate Scanner Accounts...');

  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!';
  const adminPassHash = hashPassword(defaultPassword);

  const adminAccounts = [
    {
      username: 'masteradmin@safedsheri.com',
      fullName: 'Master Admin (Main Owner - All Gates Scanner)',
      role: 'SUPER_ADMIN',
      password: process.env.MASTER_ADMIN_PASSWORD || 'MasterPass123!',
    },
    {
      username: 'admin1@safedsheri.com',
      fullName: 'Super Admin 1 (VIMMI)',
      role: 'SUPER_ADMIN',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!',
    },
    {
      username: 'admin2@safedsheri.com',
      fullName: 'Super Admin 2 (PRIYANKA)',
      role: 'SUPER_ADMIN',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!',
    },
    {
      username: 'admin3@safedsheri.com',
      fullName: 'Super Admin 3 (DELISHA)',
      role: 'SUPER_ADMIN',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!',
    },
    {
      username: 'cashier1@safedsheri.com',
      fullName: 'Cashier Desk Executive (Aarav Mehta)',
      role: 'TICKETING_FINANCE',
      password: process.env.CASHIER_DEFAULT_PASSWORD || 'CashierPass123!',
    },
    // GATE SCANNERS (4 GATES)
    {
      username: 'gate1@safedsheri.com',
      fullName: 'Gate 1 Scanner (Couple Pass Only)',
      role: 'ENTRY_VERIFICATION',
      password: process.env.GATE1_PASSWORD || 'SecurityPass123!',
    },
    {
      username: 'gate2@safedsheri.com',
      fullName: 'Gate 2 Scanner (Female/Single Pass Only)',
      role: 'ENTRY_VERIFICATION',
      password: process.env.GATE2_PASSWORD || 'SecurityPass123!',
    },
    {
      username: 'gate3@safedsheri.com',
      fullName: 'Gate 3 Scanner (Kids Pass Only)',
      role: 'ENTRY_VERIFICATION',
      password: process.env.GATE3_PASSWORD || 'SecurityPass123!',
    },
    {
      username: 'gate4@safedsheri.com',
      fullName: 'Gate 4 Scanner (Gazebo Pass Only)',
      role: 'ENTRY_VERIFICATION',
      password: process.env.GATE4_PASSWORD || 'SecurityPass123!',
    },
  ];

  for (const account of adminAccounts) {
    const existing = await prisma.user.findUnique({
      where: { username: account.username },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          username: account.username,
          passwordHash: hashPassword(account.password),
          fullName: account.fullName,
          role: account.role,
          isActive: true,
        },
      });
      console.log(`✓ Created Staff Account: ${account.username} (Role: ${account.role}, Password: ${account.password})`);
    } else {
      await prisma.user.update({
        where: { username: account.username },
        data: {
          fullName: account.fullName,
          role: account.role,
          isActive: true,
        },
      });
      console.log(`✓ Verified Staff Account: ${account.username} is Active`);
    }
  }

  console.log('🎉 Super Admin & Gate Scanner Accounts Ready!');
}

main()
  .catch((e) => {
    console.error('⚠️ Admin seeding notice:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
