import { PrismaClient, Role, RegistrationStatus, PaymentMethod, PaymentStatus, CredentialStatus, ScanResult, EntryType, VerificationMethod, GazeboStatus, GazeboInquiryStatus, InquiryStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function maskAadhaar(aadhaar: string): string {
  const clean = aadhaar.replace(/\s+/g, '');
  const last4 = clean.slice(-4);
  return `XXXX XXXX ${last4}`;
}

function encryptAadhaar(aadhaar: string): string {
  const keyString = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
  const key = Buffer.from(keyString.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(aadhaar, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// Simple hash helper for demo passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Starting Safed Sheri 2026 Database Seeding...');

  // Clean existing tables in order
  await prisma.auditLog.deleteMany();
  await prisma.scanAttempt.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.gazeboInquiry.deleteMany();
  await prisma.gazebo.deleteMany();
  await prisma.sponsorInquiry.deleteMany();
  await prisma.stallInquiry.deleteMany();
  await prisma.registrationAttendee.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.pricingPhase.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.paymentLocation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.event.deleteMany();
  await prisma.media.deleteMany();

  // 1. Create Active Event: Safed Sheri 2026
  const event = await prisma.event.create({
    data: {
      name: 'Safed Sheri 2026',
      eventDate: new Date('2026-10-09T00:00:00.000Z'),
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Event created: ${event.name} on ${event.eventDate.toISOString()}`);

  // 2. Create Pricing Phases
  const earlyBirdPhase = await prisma.pricingPhase.create({
    data: {
      phaseName: 'EARLY_BIRD',
      singlePrice: 3500,
      couplePrice: 6500,
      isActive: true,
    },
  });
  await prisma.pricingPhase.create({
    data: {
      phaseName: 'PHASE_1',
      singlePrice: 4000,
      couplePrice: 7500,
      isActive: false,
    },
  });
  await prisma.pricingPhase.create({
    data: {
      phaseName: 'PHASE_2',
      singlePrice: 4500,
      couplePrice: 9000,
      isActive: false,
    },
  });
  console.log('✅ Pricing Phases created (Active Phase: EARLY_BIRD)');

  // 3. Create Operational Staff Accounts with Canonical Roles
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin@safedsheri.com',
      passwordHash: hashPassword('AdminPass123!'),
      fullName: 'Super Admin Operational Officer',
      role: Role.SUPER_ADMIN,
    },
  });

  const financeUser = await prisma.user.create({
    data: {
      username: 'cashier1@safedsheri.com', // Retained username for seed continuity
      passwordHash: hashPassword('CashierPass123!'),
      fullName: 'Ticketing & Finance Executive 1',
      role: Role.TICKETING_FINANCE,
    },
  });

  const gateUser = await prisma.user.create({
    data: {
      username: 'security1@safedsheri.com', // Retained username for seed continuity
      passwordHash: hashPassword('SecurityPass123!'),
      fullName: 'Entry Verification Officer 1',
      role: Role.ENTRY_VERIFICATION,
    },
  });
  console.log('✅ Staff users created (SUPER_ADMIN, TICKETING_FINANCE, ENTRY_VERIFICATION)');

  // 4. Create Payment Locations
  const locationMain = await prisma.paymentLocation.create({
    data: {
      name: 'Main Gate Physical Cash Counter 1',
      address: 'Main Entrance - Counter A',
    },
  });
  const locationEast = await prisma.paymentLocation.create({
    data: {
      name: 'East Gate Physical Cash Counter 2',
      address: 'East Entrance - Counter B',
    },
  });
  console.log('✅ Payment Locations created');

  // 5. Seed 12 Physical Gazebos Across 3 Levels (4 per level)
  const gazeboLevels = [
    { level: 1, price: 85000 },
    { level: 2, price: 100000 },
    { level: 3, price: 125000 },
  ];
  for (const gLevel of gazeboLevels) {
    for (let i = 1; i <= 4; i++) {
      await prisma.gazebo.create({
        data: {
          gazeboNumber: `GZB-L${gLevel.level}-0${i}`,
          level: gLevel.level,
          price: gLevel.price,
          status: GazeboStatus.AVAILABLE,
        },
      });
    }
  }
  console.log('✅ 12 Physical Gazebos created (4 per level)');

  // 6. Seed Attendee & Registration Scenarios

  // SCENARIO A: Single Pass — Pending Payment (Unpaid Registration, NO Credential)
  const attendeeA = await prisma.attendee.create({
    data: {
      fullName: 'Rahul Sharma',
      phone: '+919876543210',
      email: 'rahul.sharma@example.com',
      aadhaarMasked: maskAadhaar('123456789012'),
      aadhaarEncrypted: encryptAadhaar('123456789012'),
    },
  });

  const regA = await prisma.registration.create({
    data: {
      registrationNumber: 'SS-2026-000101',
      eventId: event.id,
      pricingPhaseId: earlyBirdPhase.id,
      amountDue: 3500,
      status: RegistrationStatus.PENDING_PAYMENT,
      createdById: adminUser.id,
      attendees: {
        create: {
          attendeeId: attendeeA.id,
          isPrimary: true,
        },
      },
    },
  });

  // SCENARIO B: Single Pass — Paid & Active Pass Credential
  const attendeeB = await prisma.attendee.create({
    data: {
      fullName: 'Priya Patel',
      phone: '+919876543211',
      email: 'priya.patel@example.com',
      aadhaarMasked: maskAadhaar('234567890123'),
      aadhaarEncrypted: encryptAadhaar('234567890123'),
    },
  });

  const regB = await prisma.registration.create({
    data: {
      registrationNumber: 'SS-2026-000102',
      eventId: event.id,
      pricingPhaseId: earlyBirdPhase.id,
      amountDue: 3500,
      status: RegistrationStatus.PAYMENT_CONFIRMED,
      createdById: adminUser.id,
      attendees: {
        create: {
          attendeeId: attendeeB.id,
          isPrimary: true,
        },
      },
    },
  });

  const paymentB = await prisma.payment.create({
    data: {
      registrationId: regB.id,
      paymentLocationId: locationMain.id,
      collectedById: financeUser.id,
      amount: 3500,
      method: PaymentMethod.CASH,
      status: PaymentStatus.CONFIRMED,
      receiptNumber: 'RCP-2026-000102',
    },
  });

  const credB = await prisma.credential.create({
    data: {
      credentialNumber: 'PASS-2026-000102',
      registrationId: regB.id,
      attendeeId: attendeeB.id,
      secureToken: 'ss_qr_demo_ready_02',
      status: CredentialStatus.ACTIVE,
    },
  });

  // SCENARIO C: Couple Pass — Paid with 2 Individual Attendees & 2 Independent QR Credentials
  const attendeeC1 = await prisma.attendee.create({
    data: {
      fullName: 'Amit Verma',
      phone: '+919876543212',
      email: 'amit.verma@example.com',
      aadhaarMasked: maskAadhaar('345678901234'),
      aadhaarEncrypted: encryptAadhaar('345678901234'),
    },
  });
  const attendeeC2 = await prisma.attendee.create({
    data: {
      fullName: 'Neha Verma',
      phone: '+919876543213',
      email: 'neha.verma@example.com',
      aadhaarMasked: maskAadhaar('456789012345'),
      aadhaarEncrypted: encryptAadhaar('456789012345'),
    },
  });

  const regC = await prisma.registration.create({
    data: {
      registrationNumber: 'SS-2026-000103',
      eventId: event.id,
      pricingPhaseId: earlyBirdPhase.id,
      amountDue: 6500,
      status: RegistrationStatus.PAYMENT_CONFIRMED,
      createdById: adminUser.id,
      attendees: {
        create: [
          { attendeeId: attendeeC1.id, isPrimary: true },
          { attendeeId: attendeeC2.id, isPrimary: false },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      registrationId: regC.id,
      paymentLocationId: locationMain.id,
      collectedById: financeUser.id,
      amount: 6500,
      method: PaymentMethod.CASH,
      status: PaymentStatus.CONFIRMED,
      receiptNumber: 'RCP-2026-000103',
    },
  });

  // Individual Credential C1 (Used)
  const credC1 = await prisma.credential.create({
    data: {
      credentialNumber: 'PASS-2026-000103-A',
      registrationId: regC.id,
      attendeeId: attendeeC1.id,
      secureToken: 'ss_qr_demo_used_03',
      status: CredentialStatus.USED,
      usedAt: new Date(),
    },
  });

  // Individual Credential C2 (Active & Independent)
  const credC2 = await prisma.credential.create({
    data: {
      credentialNumber: 'PASS-2026-000103-B',
      registrationId: regC.id,
      attendeeId: attendeeC2.id,
      secureToken: 'ss_qr_demo_ready_couple_b',
      status: CredentialStatus.ACTIVE,
    },
  });

  // Entry record for C1
  await prisma.entry.create({
    data: {
      eventId: event.id,
      attendeeId: attendeeC1.id,
      registrationId: regC.id,
      credentialId: credC1.id,
      entryType: EntryType.QR,
      verificationMethod: VerificationMethod.QR_SCAN,
      verifiedById: gateUser.id,
    },
  });

  await prisma.scanAttempt.create({
    data: {
      eventId: event.id,
      credentialId: credC1.id,
      scannedById: gateUser.id,
      result: ScanResult.VALID,
      rawTokenScanned: 'ss_qr_demo_used_03',
    },
  });

  // SCENARIO D: Cancelled Registration & Credential
  const attendeeD = await prisma.attendee.create({
    data: {
      fullName: 'Vikram Joshi',
      phone: '+919876543214',
      aadhaarMasked: maskAadhaar('567890123456'),
      aadhaarEncrypted: encryptAadhaar('567890123456'),
    },
  });

  const regD = await prisma.registration.create({
    data: {
      registrationNumber: 'SS-2026-000104',
      eventId: event.id,
      pricingPhaseId: earlyBirdPhase.id,
      amountDue: 3500,
      status: RegistrationStatus.CANCELLED,
      createdById: adminUser.id,
      attendees: {
        create: { attendeeId: attendeeD.id, isPrimary: true },
      },
    },
  });

  await prisma.credential.create({
    data: {
      credentialNumber: 'PASS-2026-000104',
      registrationId: regD.id,
      attendeeId: attendeeD.id,
      secureToken: 'ss_qr_demo_cancelled_04',
      status: CredentialStatus.CANCELLED,
    },
  });

  // SCENARIO E: Gazebo Inquiry
  await prisma.gazeboInquiry.create({
    data: {
      inquiryNumber: 'GZB-INQ-000101',
      level: 1,
      fullName: 'Siddharth Mehta',
      phone: '+919876543299',
      notes: 'Interested in Level 1 Gazebo near stage for group of 10',
      status: GazeboInquiryStatus.NEW,
    },
  });

  // SCENARIO F: Media Assets
  await prisma.media.createMany({
    data: [
      {
        title: 'Safed Sheri Teaser Drone Footage',
        mediaType: 'VIDEO',
        filePath: 'ai video safesheri/01.mp4',
        section: 'HERO',
        sortOrder: 1,
      },
      {
        title: 'Garba Night Highlights 2025',
        mediaType: 'VIDEO',
        filePath: 'ai video safesheri/02.mp4',
        section: 'GALLERY',
        sortOrder: 2,
      },
      {
        title: 'White Garba Atmosphere Concept',
        mediaType: 'VIDEO',
        filePath: 'ai video safesheri/03.mp4',
        section: 'ATMOSPHERE',
        sortOrder: 3,
      },
    ],
  });

  console.log('✅ Seed Scenarios A through F populated successfully!');
  console.log('🎉 Safed Sheri Database Seeding Completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
