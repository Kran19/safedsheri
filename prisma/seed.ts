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

  // Alias default admin
  await prisma.user.create({
    data: {
      username: 'admin@safedsheri.com',
      passwordHash: adminPassHash,
      fullName: 'Master Admin (Super Admin)',
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
  console.log(`✓ 12 Gazebo Lounges Initialized across 3 spatial levels`);

  // Helper to create Attendee + Document
  let globalSeq = 100;
  async function createDemoAttendee(name: string, phone: string, gender: Gender, aadhaarDigits: string) {
    globalSeq++;
    const aadhaarNumber = `9999${aadhaarDigits.padStart(8, '0')}`;
    const aadhaarHmac = hmacAadhaar(aadhaarNumber);
    const aadhaarMasked = maskAadhaar(aadhaarNumber);
    const aadhaarEncrypted = encryptAadhaar(aadhaarNumber);

    const attendee = await prisma.attendee.create({
      data: {
        fullName: name,
        phone,
        email: `${name.toLowerCase().replace(/[^a-z]/g, '')}${globalSeq}@example.com`,
        gender,
        aadhaarHmac,
        aadhaarMasked,
        aadhaarEncrypted,
      },
    });

    await prisma.aadhaarDocument.create({
      data: {
        attendeeId: attendee.id,
        storageKey: `demo_doc_${globalSeq}.jpg`,
        originalFilename: `aadhaar_card_${name.replace(/\s+/g, '_')}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 245000,
        checksum: crypto.createHash('sha256').update(`demo_content_${globalSeq}`).digest('hex'),
      },
    });

    return attendee;
  }

  // Realistic Indian Female & Male Names
  const femaleNames = [
    'Ananya Sharma', 'Riya Patel', 'Pooja Joshi', 'Diya Trivedi', 'Kavya Desai',
    'Ishita Shah', 'Tanvi Mehta', 'Niyati Bhatt', 'Avani Dave', 'Sneha Vora',
    'Khushi Parikh', 'Radhika Vyas', 'Bhavna Rathod', 'Priyanka Shukla', 'Drashti Zala',
    'Meera Panchal', 'Krutika Chauhan', 'Kinjal Gandhi', 'Jhanvi Rawal', 'Kiran Patel',
    'Hetal Soni', 'Swati Raval', 'Bhoomi Goswami', 'Shreya Purohit', 'Vidhi Thakkar',
    'Jiya Modi', 'Rupal Barot', 'Purvi Pandya', 'Krupa Solanki', 'Mansi Kotak',
    'Isha Kapadia', 'Nidhi Sanghavi', 'Palak Dave', 'Komal Shah', 'Aarohi Mehta',
    'Krishna Patel', 'Devanshi Trivedi', 'Gopi Joshi', 'Payal Vaghela', 'Shweta Acharya',
    'Asha Solanki', 'Bhumika Vyas', 'Charmi Patel', 'Dhara Shukla', 'Ekta Dave',
    'Falguni Mehta', 'Geeta Shah', 'Hina Joshi', 'Ila Trivedi', 'Janki Desai',
    'Kajal Bhatt', 'Lata Vora', 'Mamta Parikh', 'Neeta Rathod', 'Priti Panchal',
    'Rekha Chauhan', 'Seema Gandhi', 'Tejal Rawal', 'Urvashi Patel', 'Varsha Soni',
    'Yogita Raval', 'Zarna Goswami', 'Amrita Purohit', 'Binal Thakkar', 'Chhaya Modi'
  ];

  const maleNames = [
    'Rahul Mehta', 'Aakash Patel', 'Rohan Shah', 'Aditya Joshi', 'Kunal Trivedi',
    'Harsh Desai', 'Siddharth Dave', 'Yash Vora', 'Parth Bhatt', 'Devang Parikh',
    'Manan Vyas', 'Neel Rathod', 'Tirth Shukla', 'Jayraj Zala', 'Smit Panchal',
    'Vivek Chauhan', 'Chintan Gandhi', 'Deep Rawal', 'Kavish Patel', 'Varun Soni',
    'Meet Raval', 'Dhruv Goswami', 'Darshan Purohit', 'Aniket Thakkar', 'Raj Modi',
    'Chirag Shah', 'Dhaval Patel', 'Gaurav Joshi', 'Hiren Trivedi', 'Jignesh Desai'
  ];

  let femaleIdx = 0;
  let maleIdx = 0;
  let regCounter = 100;

  function getFemaleName() {
    return femaleNames[(femaleIdx++) % femaleNames.length];
  }

  function getMaleName() {
    return maleNames[(maleIdx++) % maleNames.length];
  }

  // -------------------------------------------------------------
  // GROUP 1: Paid + Active Single Passes (15 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 15; i++) {
    regCounter++;
    const name = getFemaleName();
    const phone = `+9198765${(10000 + regCounter).toString().slice(-5)}`;
    const attendee = await createDemoAttendee(name, phone, Gender.FEMALE, regCounter.toString());

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.SINGLE,
        amountDue: 3500.0,
        status: RegistrationStatus.PASS_ISSUED,
        paymentLinkId: `paylink_${crypto.randomBytes(8).toString('hex')}`,
        reviewedById: superAdmin.id,
        reviewedAt: new Date(),
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.create({
      data: { registrationId: reg.id, attendeeId: attendee.id, isPrimary: true },
    });

    await prisma.payment.create({
      data: {
        registrationId: reg.id,
        amount: 3500.0,
        method: PaymentMethod.ONLINE_GATEWAY,
        status: PaymentStatus.CONFIRMED,
        receiptNumber: `RCP-2026-${(2000 + regCounter).toString()}`,
        providerReference: `PG-TXN-ACTIVE-${regCounter}`,
      },
    });

    const passCode = `SS26-SINGLE-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    await prisma.credential.create({
      data: {
        credentialNumber: `PASS-2026-${(3000 + regCounter).toString()}`,
        passCode,
        registrationId: reg.id,
        attendeeId: attendee.id,
        secureToken: `ss_qr_${crypto.randomBytes(32).toString('hex')}`,
        status: CredentialStatus.ACTIVE,
      },
    });
  }
  console.log('✓ Group 1 Seeded: 15 Paid + Active Single Passes');

  // -------------------------------------------------------------
  // GROUP 2: Paid + Used Single Passes (10 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 10; i++) {
    regCounter++;
    const name = getFemaleName();
    const phone = `+9198765${(10000 + regCounter).toString().slice(-5)}`;
    const attendee = await createDemoAttendee(name, phone, Gender.FEMALE, regCounter.toString());

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.SINGLE,
        amountDue: 3500.0,
        status: RegistrationStatus.PASS_ISSUED,
        paymentLinkId: `paylink_${crypto.randomBytes(8).toString('hex')}`,
        reviewedById: superAdmin.id,
        reviewedAt: new Date(),
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.create({
      data: { registrationId: reg.id, attendeeId: attendee.id, isPrimary: true },
    });

    await prisma.payment.create({
      data: {
        registrationId: reg.id,
        amount: 3500.0,
        method: PaymentMethod.ONLINE_GATEWAY,
        status: PaymentStatus.CONFIRMED,
        receiptNumber: `RCP-2026-${(2000 + regCounter).toString()}`,
        providerReference: `PG-TXN-USED-${regCounter}`,
      },
    });

    const passCode = `SS26-SINGLE-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const secureToken = `ss_qr_${crypto.randomBytes(32).toString('hex')}`;
    const credential = await prisma.credential.create({
      data: {
        credentialNumber: `PASS-2026-${(3000 + regCounter).toString()}`,
        passCode,
        registrationId: reg.id,
        attendeeId: attendee.id,
        secureToken,
        status: CredentialStatus.USED,
        usedAt: new Date(),
      },
    });

    await prisma.entry.create({
      data: {
        eventId: event.id,
        attendeeId: attendee.id,
        registrationId: reg.id,
        credentialId: credential.id,
        entryType: EntryType.QR,
        verificationMethod: VerificationMethod.QR_SCAN,
        verifiedById: securityUser.id,
      },
    });

    await prisma.scanAttempt.create({
      data: {
        eventId: event.id,
        credentialId: credential.id,
        scannedById: securityUser.id,
        result: ScanResult.VALID,
        rawTokenScanned: secureToken,
      },
    });
  }
  console.log('✓ Group 2 Seeded: 10 Paid + Used Single Passes (with Valid Gate Entries)');

  // -------------------------------------------------------------
  // GROUP 3: Paid + Active Couple Passes (8 Bookings = 16 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 8; i++) {
    regCounter++;
    const fName = getFemaleName();
    const mName = getMaleName();
    const phone1 = `+9198765${(10000 + regCounter).toString().slice(-5)}`;
    const phone2 = `+9198765${(20000 + regCounter).toString().slice(-5)}`;

    const att1 = await createDemoAttendee(fName, phone1, Gender.FEMALE, `${regCounter}1`);
    const att2 = await createDemoAttendee(mName, phone2, Gender.MALE, `${regCounter}2`);

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.COUPLE,
        amountDue: 6500.0,
        status: RegistrationStatus.PASS_ISSUED,
        paymentLinkId: `paylink_${crypto.randomBytes(8).toString('hex')}`,
        reviewedById: superAdmin.id,
        reviewedAt: new Date(),
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.createMany({
      data: [
        { registrationId: reg.id, attendeeId: att1.id, isPrimary: true },
        { registrationId: reg.id, attendeeId: att2.id, isPrimary: false },
      ],
    });

    await prisma.payment.create({
      data: {
        registrationId: reg.id,
        amount: 6500.0,
        method: PaymentMethod.ONLINE_GATEWAY,
        status: PaymentStatus.CONFIRMED,
        receiptNumber: `RCP-2026-${(2000 + regCounter).toString()}`,
        providerReference: `PG-TXN-CPL-${regCounter}`,
      },
    });

    for (const att of [att1, att2]) {
      const passCode = `SS26-COUPLE-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      await prisma.credential.create({
        data: {
          credentialNumber: `PASS-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          passCode,
          registrationId: reg.id,
          attendeeId: att.id,
          secureToken: `ss_qr_${crypto.randomBytes(32).toString('hex')}`,
          status: CredentialStatus.ACTIVE,
        },
      });
    }
  }
  console.log('✓ Group 3 Seeded: 8 Paid + Active Couple Passes (16 Attendees)');

  // -------------------------------------------------------------
  // GROUP 4: Paid + Used Couple Passes (3 Bookings = 6 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 3; i++) {
    regCounter++;
    const fName = getFemaleName();
    const mName = getMaleName();
    const phone1 = `+9198765${(10000 + regCounter).toString().slice(-5)}`;
    const phone2 = `+9198765${(20000 + regCounter).toString().slice(-5)}`;

    const att1 = await createDemoAttendee(fName, phone1, Gender.FEMALE, `${regCounter}1`);
    const att2 = await createDemoAttendee(mName, phone2, Gender.MALE, `${regCounter}2`);

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.COUPLE,
        amountDue: 6500.0,
        status: RegistrationStatus.PASS_ISSUED,
        paymentLinkId: `paylink_${crypto.randomBytes(8).toString('hex')}`,
        reviewedById: superAdmin.id,
        reviewedAt: new Date(),
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.createMany({
      data: [
        { registrationId: reg.id, attendeeId: att1.id, isPrimary: true },
        { registrationId: reg.id, attendeeId: att2.id, isPrimary: false },
      ],
    });

    await prisma.payment.create({
      data: {
        registrationId: reg.id,
        amount: 6500.0,
        method: PaymentMethod.ONLINE_GATEWAY,
        status: PaymentStatus.CONFIRMED,
        receiptNumber: `RCP-2026-${(2000 + regCounter).toString()}`,
        providerReference: `PG-TXN-CPL-USED-${regCounter}`,
      },
    });

    for (const att of [att1, att2]) {
      const passCode = `SS26-COUPLE-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const secureToken = `ss_qr_${crypto.randomBytes(32).toString('hex')}`;
      const credential = await prisma.credential.create({
        data: {
          credentialNumber: `PASS-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          passCode,
          registrationId: reg.id,
          attendeeId: att.id,
          secureToken,
          status: CredentialStatus.USED,
          usedAt: new Date(),
        },
      });

      await prisma.entry.create({
        data: {
          eventId: event.id,
          attendeeId: att.id,
          registrationId: reg.id,
          credentialId: credential.id,
          entryType: EntryType.QR,
          verificationMethod: VerificationMethod.QR_SCAN,
          verifiedById: securityUser.id,
        },
      });
    }
  }
  console.log('✓ Group 4 Seeded: 3 Paid + Used Couple Passes (6 Attendees)');

  // -------------------------------------------------------------
  // GROUP 5: Paid Gazebo Passes (2 Bookings = 6 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 2; i++) {
    regCounter++;
    const hostName = getFemaleName();
    const guest1 = getMaleName();
    const guest2 = getFemaleName();

    const att1 = await createDemoAttendee(hostName, `+9198765${(10000 + regCounter).toString().slice(-5)}`, Gender.FEMALE, `${regCounter}1`);
    const att2 = await createDemoAttendee(guest1, `+9198765${(20000 + regCounter).toString().slice(-5)}`, Gender.MALE, `${regCounter}2`);
    const att3 = await createDemoAttendee(guest2, `+9198765${(30000 + regCounter).toString().slice(-5)}`, Gender.FEMALE, `${regCounter}3`);

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.GAZEBO,
        amountDue: 85000.0,
        status: RegistrationStatus.PASS_ISSUED,
        paymentLinkId: `paylink_${crypto.randomBytes(8).toString('hex')}`,
        reviewedById: superAdmin.id,
        reviewedAt: new Date(),
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.createMany({
      data: [
        { registrationId: reg.id, attendeeId: att1.id, isPrimary: true },
        { registrationId: reg.id, attendeeId: att2.id, isPrimary: false },
        { registrationId: reg.id, attendeeId: att3.id, isPrimary: false },
      ],
    });

    await prisma.payment.create({
      data: {
        registrationId: reg.id,
        amount: 85000.0,
        method: PaymentMethod.ONLINE_GATEWAY,
        status: PaymentStatus.CONFIRMED,
        receiptNumber: `RCP-2026-${(2000 + regCounter).toString()}`,
        providerReference: `PG-TXN-GZB-${regCounter}`,
      },
    });

    for (const att of [att1, att2, att3]) {
      const passCode = `SS26-GAZEBO-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      await prisma.credential.create({
        data: {
          credentialNumber: `PASS-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          passCode,
          registrationId: reg.id,
          attendeeId: att.id,
          secureToken: `ss_qr_${crypto.randomBytes(32).toString('hex')}`,
          status: CredentialStatus.ACTIVE,
        },
      });
    }

    await prisma.gazebo.update({
      where: { id: gazebos[i].id },
      data: { status: GazeboStatus.CONFIRMED },
    });
  }
  console.log('✓ Group 5 Seeded: 2 Paid Gazebo Bookings (6 Attendees)');

  // -------------------------------------------------------------
  // GROUP 6: Payment Pending (Approved by Admin) (15 Bookings = 15 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 15; i++) {
    regCounter++;
    const name = getFemaleName();
    const phone = `+9198765${(10000 + regCounter).toString().slice(-5)}`;
    const attendee = await createDemoAttendee(name, phone, Gender.FEMALE, regCounter.toString());

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.SINGLE,
        amountDue: 3500.0,
        status: RegistrationStatus.PAYMENT_PENDING,
        paymentLinkId: `paylink_${crypto.randomBytes(8).toString('hex')}`,
        reviewedById: superAdmin.id,
        reviewedAt: new Date(),
        reviewNotes: 'Verified Aadhaar documents. Approved for payment.',
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.create({
      data: { registrationId: reg.id, attendeeId: attendee.id, isPrimary: true },
    });
  }
  console.log('✓ Group 6 Seeded: 15 Approved Applications in PAYMENT_PENDING');

  // -------------------------------------------------------------
  // GROUP 7: Under Review Applications (15 Bookings = 15 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 15; i++) {
    regCounter++;
    const name = getFemaleName();
    const phone = `+9198765${(10000 + regCounter).toString().slice(-5)}`;
    const attendee = await createDemoAttendee(name, phone, Gender.FEMALE, regCounter.toString());

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.SINGLE,
        amountDue: 3500.0,
        status: RegistrationStatus.UNDER_REVIEW,
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.create({
      data: { registrationId: reg.id, attendeeId: attendee.id, isPrimary: true },
    });
  }
  console.log('✓ Group 7 Seeded: 15 New Applications in UNDER_REVIEW');

  // -------------------------------------------------------------
  // GROUP 8: Rejected Applications (8 Bookings = 8 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 8; i++) {
    regCounter++;
    const name = getFemaleName();
    const phone = `+9198765${(10000 + regCounter).toString().slice(-5)}`;
    const attendee = await createDemoAttendee(name, phone, Gender.FEMALE, regCounter.toString());

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.SINGLE,
        amountDue: 3500.0,
        status: RegistrationStatus.REJECTED,
        reviewNotes: 'Blurred Aadhaar document image. Please re-apply with a high-clarity document.',
        reviewedById: superAdmin.id,
        reviewedAt: new Date(),
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.create({
      data: { registrationId: reg.id, attendeeId: attendee.id, isPrimary: true },
    });
  }
  console.log('✓ Group 8 Seeded: 8 REJECTED Applications with Review Notes');

  // -------------------------------------------------------------
  // GROUP 9: Cancelled Applications (5 Bookings = 5 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 5; i++) {
    regCounter++;
    const name = getFemaleName();
    const phone = `+9198765${(10000 + regCounter).toString().slice(-5)}`;
    const attendee = await createDemoAttendee(name, phone, Gender.FEMALE, regCounter.toString());

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.SINGLE,
        amountDue: 3500.0,
        status: RegistrationStatus.CANCELLED,
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.create({
      data: { registrationId: reg.id, attendeeId: attendee.id, isPrimary: true },
    });
  }
  console.log('✓ Group 9 Seeded: 5 CANCELLED Applications');

  // -------------------------------------------------------------
  // GROUP 10: Payment Failed Applications (2 Bookings = 2 Attendees)
  // -------------------------------------------------------------
  for (let i = 0; i < 2; i++) {
    regCounter++;
    const name = getFemaleName();
    const phone = `+9198765${(10000 + regCounter).toString().slice(-5)}`;
    const attendee = await createDemoAttendee(name, phone, Gender.FEMALE, regCounter.toString());

    const reg = await prisma.registration.create({
      data: {
        registrationNumber: `SS-2026-${regCounter.toString().padStart(6, '0')}`,
        eventId: event.id,
        pricingPhaseId: earlyBirdPhase.id,
        passType: PassType.SINGLE,
        amountDue: 3500.0,
        status: RegistrationStatus.PAYMENT_FAILED,
        paymentLinkId: `paylink_${crypto.randomBytes(8).toString('hex')}`,
        reviewedById: superAdmin.id,
        reviewedAt: new Date(),
        createdById: superAdmin.id,
      },
    });

    await prisma.registrationAttendee.create({
      data: { registrationId: reg.id, attendeeId: attendee.id, isPrimary: true },
    });

    await prisma.payment.create({
      data: {
        registrationId: reg.id,
        amount: 3500.0,
        method: PaymentMethod.ONLINE_GATEWAY,
        status: PaymentStatus.FAILED,
        receiptNumber: `RCP-2026-FAIL-${regCounter}`,
        providerReference: `PG-TXN-FAIL-${regCounter}`,
        failureReason: 'Bank network timeout or insufficient funds during authentication',
      },
    });
  }
  console.log('✓ Group 10 Seeded: 2 PAYMENT_FAILED Applications');

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
