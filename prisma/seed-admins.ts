import { PrismaClient, Role } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('====================================================');
  console.log('🛡️ SEEDING / SYNCHRONIZING 3 SUPER ADMIN ACCOUNTS');
  console.log('====================================================');

  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminPass123!';
  const adminPassHash = hashPassword(defaultPassword);

  const adminAccounts = [
    {
      username: 'admin1@safedsheri.com',
      fullName: 'Super Admin 1 (VIMMI)',
      role: Role.SUPER_ADMIN,
    },
    {
      username: 'admin2@safedsheri.com',
      fullName: 'Super Admin 2 (PRIYANKA)',
      role: Role.SUPER_ADMIN,
    },
    {
      username: 'admin3@safedsheri.com',
      fullName: 'Super Admin 3 (DELISHA)',
      role: Role.SUPER_ADMIN,
    },
  ];

  // Remove legacy master admin if present
  try {
    const deleted = await prisma.user.deleteMany({
      where: { username: 'admin@safedsheri.com' },
    });
    if (deleted.count > 0) {
      console.log('✓ Removed legacy master admin account (admin@safedsheri.com)');
    }
  } catch (e) {
    // ignore
  }

  for (const account of adminAccounts) {
    const user = await prisma.user.upsert({
      where: { username: account.username },
      update: {
        fullName: account.fullName,
        role: account.role,
        isActive: true,
      },
      create: {
        username: account.username,
        passwordHash: adminPassHash,
        fullName: account.fullName,
        role: account.role,
        isActive: true,
      },
    });

    console.log(`✓ Admin User Synchronized: ${user.username} (${user.fullName}) [Role: ${user.role}]`);
  }

  console.log('====================================================');
  console.log('🎉 ALL 3 SUPER ADMIN ACCOUNTS ARE ACTIVE AND READY TO LOGIN!');
  console.log(`Default Password: ${defaultPassword}`);
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('Error seeding admin accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
