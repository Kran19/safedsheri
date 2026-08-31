const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🛡️ Auto-Synchronizing 3 Super Admin Accounts...');

  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!';
  const adminPassHash = hashPassword(defaultPassword);

  const adminAccounts = [
    {
      username: 'masteradmin@safedsheri.com',
      fullName: 'Master Admin (Main Owner)',
      role: 'SUPER_ADMIN',
      password: process.env.MASTER_ADMIN_PASSWORD || 'MasterPass123!',
    },
    {
      username: 'admin1@safedsheri.com',
      fullName: 'Super Admin 1 (Vikramaditya Solanki)',
      role: 'SUPER_ADMIN',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!',
    },
    {
      username: 'admin2@safedsheri.com',
      fullName: 'Super Admin 2 (Rudra Pratap Singh)',
      role: 'SUPER_ADMIN',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!',
    },
    {
      username: 'admin3@safedsheri.com',
      fullName: 'Super Admin 3 (Harshvardhan Jadeja)',
      role: 'SUPER_ADMIN',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!',
    },
    {
      username: 'cashier1@safedsheri.com',
      fullName: 'Cashier Desk Executive (Aarav Mehta)',
      role: 'TICKETING_FINANCE',
      password: process.env.CASHIER_DEFAULT_PASSWORD || 'CashierPass123!',
    },
    {
      username: 'gate1@safedsheri.com',
      fullName: 'Gate Verification Lead (Digvijay Jadeja)',
      role: 'ENTRY_VERIFICATION',
      password: process.env.GATE_DEFAULT_PASSWORD || 'SecurityPass123!',
    },
  ];

  // Clean up old legacy admin
  try {
    const deleted = await prisma.user.deleteMany({
      where: { username: 'admin@safedsheri.com' },
    });
    if (deleted.count > 0) {
      console.log('✓ Cleaned up legacy admin@safedsheri.com');
    }
  } catch (err) {
    // ignore
  }

  for (const account of adminAccounts) {
    // Only set default password if user does not exist yet (so any password changes by the admin are preserved)
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
          role: account.role,
          isActive: true,
        },
      });
      console.log(`✓ Verified Staff Account: ${account.username} is Active`);
    }
  }

  console.log('🎉 Super Admin Accounts Ready!');
}

main()
  .catch((e) => {
    console.error('⚠️ Admin seeding notice:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
