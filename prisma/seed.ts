import {
  PrismaClient,
  Role,
  Gender,
  PassType,
  RegistrationStatus,
  PaymentMethod,
  PaymentStatus,
  CredentialStatus,
  ScanResult,
  EntryType,
  VerificationMethod,
  GazeboStatus,
} from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const HMAC_SECRET = process.env.AADHAAR_HMAC_SECRET || 'safed_sheri_2026_aadhaar_hmac_secret_key_prod';
const ENCRYPTION_KEY = Buffer.from((process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef').padEnd(32, '0').slice(0, 32));

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function maskAadhaar(raw: string): string {
  const clean = raw.replace(/\s+/g, '');
  return `XXXX XXXX ${clean.slice(-4)}`;
}

function encryptAadhaar(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function hmacAadhaar(raw: string): string {
  const clean = raw.replace(/\s+/g, '').trim();
  return crypto.createHmac('sha256', HMAC_SECRET).update(clean).digest('hex');
}

async function main() {
  console.log('====================================================');
  console.log('🌱 SEEDING SAFED SHERI 2026 MASTER DATABASE');
  console.log('====================================================');

  // Clean existing data
  await prisma.scanAttempt.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.registrationAttendee.deleteMany();
  await prisma.aadhaarDocument.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.gazeboInquiry.deleteMany();
  await prisma.gazebo.deleteMany();
  await prisma.sponsorInquiry.deleteMany();
  await prisma.stallInquiry.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.pricingPhase.deleteMany();
  await prisma.paymentLocation.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Core Event
  const event = await prisma.event.create({
    data: {
      name: 'Safed Sheri 2026',
      eventDate: new Date('2026-10-09T18:00:00.000Z'),
      status: 'ACTIVE',
    },
  });
  console.log(`✓ Event Created: ${event.name} (Canonical Date: 09.10.2026)`);

  // 2. Create Pricing Phases
  const earlyBirdPhase = await prisma.pricingPhase.create({
    data: {
      phaseName: 'EARLY_BIRD',
      singlePrice: 3500.0,
      couplePrice: 6500.0,
      isActive: true,
    },
  });

  await prisma.pricingPhase.create({
    data: {
      phaseName: 'REGULAR',
      singlePrice: 4500.0,
      couplePrice: 8500.0,
      isActive: false,
    },
  });
  console.log('✓ Pricing Phases Initialized (Early Bird: Single ₹3500, Couple ₹6500)');

  // 3. Create Demo Staff Users & 3 Super Admin Accounts
  const adminPassHash = hashPassword('AdminPass123!');
  const cashierPassHash = hashPassword('CashierPass123!');
  const securityPassHash = hashPassword('SecurityPass123!');

  // Super Admin 1
  const superAdmin = await prisma.user.create({
    data: {
      username: 'admin1@safedsheri.com',
      passwordHash: adminPassHash,
      fullName: 'Vikramaditya Solanki (Super Admin 1)',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  // Super Admin 2
  const superAdmin2 = await prisma.user.create({
    data: {
      username: 'admin2@safedsheri.com',
      passwordHash: adminPassHash,
      fullName: 'Rudra Pratap Singh (Super Admin 2)',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  // Super Admin 3
  const superAdmin3 = await prisma.user.create({
    data: {
      username: 'admin3@safedsheri.com',
      passwordHash: adminPassHash,
      fullName: 'Harshvardhan Jadeja (Super Admin 3)',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      username: 'cashier1@safedsheri.com',
      passwordHash: cashierPassHash,
      fullName: 'Aarav Mehta (Cashier Executive)',
      role: Role.TICKETING_FINANCE,
      isActive: true,
    },
  });

  const securityUser = await prisma.user.create({
    data: {
      username: 'gate1@safedsheri.com',
      passwordHash: securityPassHash,
      fullName: 'Digvijay Jadeja (Gate Verification Lead)',
      role: Role.ENTRY_VERIFICATION,
      isActive: true,
    },
  });
  console.log('✓ Demo Staff Accounts Seeded (3 Super Admins, Cashier, Security)');

  // 4. Payment Locations
  await prisma.paymentLocation.create({
    data: {
      name: 'Club O7 Box Office Counter A',
      address: 'Shela, Ahmedabad, Gujarat',
      isActive: true,
    },
  });

  // 5. Gazebos
  const gazebos: any[] = [];
  for (let l = 1; l <= 3; l++) {
    const price = l === 1 ? 85000 : l === 2 ? 100000 : 125000;
    for (let g = 1; g <= 4; g++) {
      const gzb = await prisma.gazebo.create({
        data: {
          gazeboNumber: `GZB-L${l}-0${g}`,
          level: l,
          price,
          status: GazeboStatus.AVAILABLE,
        },
      });
      gazebos.push(gzb);
    }
  }
  console.log(`✓ 12 Gazebo Lounges Initialized across 3 spatial levels // (Dummy data generation has been removed)`);

  const totalAttendeesSeeded = await prisma.attendee.count();
  const totalRegistrationsSeeded = await prisma.registration.count();
  const totalCredentialsSeeded = await prisma.credential.count();

  console.log('\n====================================================');
  console.log(`🎉 SEEDING COMPLETED: ${totalAttendeesSeeded} ATTENDEES | ${totalRegistrationsSeeded} BOOKINGS | ${totalCredentialsSeeded} QR PASSES`);
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
