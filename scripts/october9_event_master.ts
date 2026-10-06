import { PrismaClient, ScanResult, CredentialStatus, EntryType, VerificationMethod } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function printHeader() {
  console.log('\n===============================================================');
  console.log('       SAFED SHERI 2026 - OCTOBER 9TH MASTER EVENT SCRIPT');
  console.log('       Gate Pass Scanner Emergency Control & Live Audit Tool');
  console.log('===============================================================\n');
}

async function runHealthDiagnostic() {
  console.log('🔍 [1/5] RUNNING LIVE SYSTEM & GATE HEALTH DIAGNOSTIC...\n');
  try {
    const activeEvent = await prisma.event.findFirst({ where: { status: 'ACTIVE' } });
    if (!activeEvent) {
      console.log('❌ ERROR: No active event found in database!');
      return;
    }

    console.log(`✅ Database Connected! Active Event: "${activeEvent.name}" (ID: ${activeEvent.id})`);

    const totalCredentials = await prisma.credential.count();
    const activeCredentials = await prisma.credential.count({ where: { status: CredentialStatus.ACTIVE } });
    const usedCredentials = await prisma.credential.count({ where: { status: CredentialStatus.USED } });
    const totalEntries = await prisma.entry.count();

    console.log(`\n📊 OVERALL TICKETING METRICS:`);
    console.log(`- Total Issued Credentials: ${totalCredentials}`);
    console.log(`- Active Credentials (Unused): ${activeCredentials}`);
    console.log(`- Used Credentials (Checked In): ${usedCredentials}`);
    console.log(`- Total Venue Entry Records: ${totalEntries}`);

    // Category Breakdown
    const entries = await prisma.entry.findMany({
      include: { registration: { select: { passType: true } } },
    });

    const categoryCounts: Record<string, number> = { COUPLE: 0, SINGLE: 0, KIDS: 0, GAZEBO: 0 };
    for (const e of entries) {
      const pt = e.registration?.passType;
      if (pt && categoryCounts[pt] !== undefined) {
        categoryCounts[pt]++;
      }
    }

    console.log(`\n🎟️ CHECKED-IN BREAKDOWN BY PASS CATEGORY:`);
    console.log(`  - Couple Passes:  ${categoryCounts.COUPLE}`);
    console.log(`  - Single Passes:  ${categoryCounts.SINGLE}`);
    console.log(`  - Kids Passes:    ${categoryCounts.KIDS}`);
    console.log(`  - Gazebo Passes:  ${categoryCounts.GAZEBO}`);

    // Gate Breakdown
    const gateScanAttempts = await prisma.scanAttempt.findMany({
      where: { result: ScanResult.VALID },
      select: { gateId: true },
    });

    const gateCounts: Record<string, number> = { GATE_1: 0, GATE_2: 0, GATE_3: 0, GATE_4: 0, MASTER_ADMIN: 0 };
    for (const s of gateScanAttempts) {
      const g = s.gateId || 'GATE_1';
      gateCounts[g] = (gateCounts[g] || 0) + 1;
    }

    console.log(`\n🚪 LIVE SCANNER VOLUME PER GATE:`);
    console.log(`  - Gate 1 (Couple Pass Only):  ${gateCounts.GATE_1}`);
    console.log(`  - Gate 2 (Single Pass Only):  ${gateCounts.GATE_2}`);
    console.log(`  - Gate 3 (Kids Pass Only):    ${gateCounts.GATE_3}`);
    console.log(`  - Gate 4 (Gazebo Pass Only):  ${gateCounts.GATE_4}`);
    console.log(`  - Master Admin Override Gate: ${gateCounts.MASTER_ADMIN}`);

    // Recent Errors / Wrong Gate Attempts
    const wrongGateCount = await prisma.scanAttempt.count({ where: { result: ScanResult.WRONG_GATE } });
    const duplicateCount = await prisma.scanAttempt.count({ where: { result: ScanResult.ALREADY_USED } });

    console.log(`\n⚠️ SCAN REJECTIONS & GATE ERRORS:`);
    console.log(`  - Wrong Gate Scans: ${wrongGateCount}`);
    console.log(`  - Duplicate / Already Used Scans: ${duplicateCount}`);

  } catch (err: any) {
    console.error('❌ Diagnostic failed with error:', err.message);
  }
}

async function inspectPass(searchQuery: string) {
  if (!searchQuery?.trim()) {
    console.log('⚠️ Please provide a pass code, token, phone, or registration number.');
    return;
  }

  const query = searchQuery.trim();
  console.log(`\n🔍 INSPECTING PASS DETAILS FOR QUERY: "${query}"...`);

  const credential = await prisma.credential.findFirst({
    where: {
      OR: [
        { passCode: { equals: query, mode: 'insensitive' } },
        { secureToken: { equals: query, mode: 'insensitive' } },
        { credentialNumber: { equals: query, mode: 'insensitive' } },
        { attendee: { phone: { contains: query } } },
        { registration: { registrationNumber: { equals: query, mode: 'insensitive' } } },
      ],
    },
    include: {
      attendee: true,
      registration: true,
      entries: { orderBy: { createdAt: 'desc' } },
      scanAttempts: { orderBy: { scannedAt: 'desc' }, take: 5 },
    },
  });

  if (!credential) {
    console.log(`❌ No matching pass found for query: "${query}"`);
    return;
  }

  console.log('\n================ PASS PROFILE DETAILS ================');
  console.log(`Pass Code:       ${credential.passCode}`);
  console.log(`Secure Token:    ${credential.secureToken}`);
  console.log(`Status:          ${credential.status}`);
  console.log(`Pass Category:   ${credential.registration?.passType}`);
  console.log(`Registration #:  ${credential.registration?.registrationNumber}`);
  console.log(`Attendee Name:   ${credential.attendee?.fullName}`);
  console.log(`Phone Number:    ${credential.attendee?.phone}`);
  console.log(`Issued At:       ${credential.issuedAt.toLocaleString()}`);
  console.log(`Used At:         ${credential.usedAt ? credential.usedAt.toLocaleString() : 'Not Used Yet'}`);

  if (credential.scanAttempts.length > 0) {
    console.log('\n📋 Recent Scan Attempts:');
    credential.scanAttempts.forEach((s, idx) => {
      console.log(`  [${idx + 1}] Gate: ${s.gateId || 'N/A'} | Result: ${s.result} | Scanned At: ${s.scannedAt.toLocaleString()}`);
    });
  }

  if (credential.entries.length > 0) {
    console.log('\n🚪 Verified Venue Entries:');
    credential.entries.forEach((e, idx) => {
      console.log(`  [${idx + 1}] Gate: ${e.gateId || 'N/A'} | Type: ${e.entryType} | Verified At: ${e.createdAt.toLocaleString()}`);
    });
  }
  console.log('======================================================\n');
}

async function resetPassStatus(passCode: string) {
  if (!passCode?.trim()) {
    console.log('⚠️ Pass code is required.');
    return;
  }

  const query = passCode.trim();
  const credential = await prisma.credential.findFirst({
    where: {
      OR: [
        { passCode: { equals: query, mode: 'insensitive' } },
        { secureToken: { equals: query, mode: 'insensitive' } },
        { credentialNumber: { equals: query, mode: 'insensitive' } },
      ],
    },
    include: { attendee: true },
  });

  if (!credential) {
    console.log(`❌ Pass "${query}" not found.`);
    return;
  }

  console.log(`⚠️ Resetting pass "${credential.passCode}" for ${credential.attendee?.fullName} from ${credential.status} -> ACTIVE...`);

  await prisma.credential.update({
    where: { id: credential.id },
    data: {
      status: CredentialStatus.ACTIVE,
      usedAt: null,
    },
  });

  console.log(`✅ SUCCESS! Pass "${credential.passCode}" has been reactivated. Guest can scan and enter venue.`);
}

async function forceEmergencyScan(passCode: string, gateId: string = 'MASTER_ADMIN') {
  if (!passCode?.trim()) {
    console.log('⚠️ Pass code is required.');
    return;
  }

  const query = passCode.trim();
  const activeEvent = await prisma.event.findFirst({ where: { status: 'ACTIVE' } });
  if (!activeEvent) {
    console.log('❌ No active event found.');
    return;
  }

  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!adminUser) {
    console.log('❌ Admin user not found.');
    return;
  }

  const credential = await prisma.credential.findFirst({
    where: {
      OR: [
        { passCode: { equals: query, mode: 'insensitive' } },
        { secureToken: { equals: query, mode: 'insensitive' } },
        { credentialNumber: { equals: query, mode: 'insensitive' } },
      ],
    },
    include: { attendee: true, registration: true },
  });

  if (!credential) {
    console.log(`❌ Pass "${query}" not found.`);
    return;
  }

  const now = new Date();
  await prisma.credential.update({
    where: { id: credential.id },
    data: {
      status: CredentialStatus.USED,
      usedAt: now,
    },
  });

  await prisma.entry.create({
    data: {
      eventId: activeEvent.id,
      attendeeId: credential.attendeeId,
      registrationId: credential.registrationId,
      credentialId: credential.id,
      gateId: gateId,
      entryType: EntryType.DIRECT,
      verificationMethod: VerificationMethod.MANUAL,
      verifiedById: adminUser.id,
      notes: `October 9th Emergency Master Override Scan for ${credential.attendee.fullName}`,
    },
  });

  await prisma.scanAttempt.create({
    data: {
      eventId: activeEvent.id,
      credentialId: credential.id,
      scannedById: adminUser.id,
      gateId: gateId,
      result: ScanResult.VALID,
      rawTokenScanned: query,
    },
  });

  console.log(`\n🎉 EMERGENCY OVERRIDE SUCCESSFUL!`);
  console.log(`  - Attendee: ${credential.attendee.fullName}`);
  console.log(`  - Pass Code: ${credential.passCode}`);
  console.log(`  - Category: ${credential.registration?.passType}`);
  console.log(`  - Gate: ${gateId}`);
  console.log(`  - Timestamp: ${now.toLocaleString()}\n`);
}

async function clearTestScans() {
  console.log('🧹 CLEARING PREVIOUS TEST SCAN LOGS & RESETTING ALL PASSES TO ACTIVE (START FROM 0)...');

  const updatedCreds = await prisma.credential.updateMany({
    data: {
      status: CredentialStatus.ACTIVE,
      usedAt: null,
    },
  });

  const deletedEntries = await prisma.entry.deleteMany({});
  const deletedScanAttempts = await prisma.scanAttempt.deleteMany({});

  console.log(`\n🎉 EVENT SCANNER CLEANUP COMPLETE!`);
  console.log(`  - Reactivated Credentials: ${updatedCreds.count}`);
  console.log(`  - Deleted Test Entries: ${deletedEntries.count}`);
  console.log(`  - Deleted Test Scan Attempts: ${deletedScanAttempts.count}`);
  console.log(`\nAll gate terminals will now start fresh at 0 scans on event day!`);
}

async function exportCustomerContactsPdf() {
  console.log('📄 GENERATING CATEGORY-WISE SEPARATED CUSTOMER CONTACT PDFS & CSVS...');

  const PDFDocument = require('pdfkit');

  const registrations = await prisma.registration.findMany({
    where: { deletedAt: null },
    include: {
      attendees: { include: { attendee: true } },
      credentials: { select: { passCode: true } },
      createdBy: { select: { username: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const categorized: Record<string, any[]> = {
    SINGLE: [],
    COUPLE: [],
    KIDS: [],
    GAZEBO: [],
  };

  for (const reg of registrations) {
    const pt = reg.passType || 'SINGLE';
    for (const ra of reg.attendees) {
      const att = ra.attendee;
      if (!att) continue;

      let email = att.email;
      if (!email || email === 'N/A') {
        if (reg.createdBy?.username?.includes('@')) {
          email = reg.createdBy.username;
        } else {
          email = `${att.fullName.toLowerCase().replace(/\s+/g, '.')}@safedsheri.guest`;
        }
      }

      const item = {
        fullName: att.fullName,
        phone: att.phone,
        email: email,
        passType: pt,
        registrationNumber: reg.registrationNumber,
        passCode: reg.credentials?.[0]?.passCode || 'N/A',
        status: reg.status,
      };

      if (categorized[pt]) {
        categorized[pt].push(item);
      } else {
        categorized.SINGLE.push(item);
      }
    }
  }

  const generateCategoryPdf = (catKey: string, fileName: string, title: string, items: any[]) => {
    return new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const stream = fs.createWriteStream(fileName);
      doc.pipe(stream);

      doc.fontSize(18).fillColor('#2D1F0E').text('SAFED SHERI 2026', { align: 'center' });
      doc.fontSize(12).fillColor('#8C6019').text(title.toUpperCase(), { align: 'center' });
      doc.fontSize(9).fillColor('#6E5336').text(`Total Contacts: ${items.length} • Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);

      let y = doc.y;
      doc.fontSize(8).fillColor('#8C6019').font('Helvetica-Bold');
      doc.text('#', 30, y);
      doc.text('Customer Name', 55, y);
      doc.text('WhatsApp / Phone', 190, y);
      doc.text('Email Address', 310, y);
      doc.text('Pass Code', 470, y);

      doc.moveTo(30, y + 12).lineTo(565, y + 12).strokeColor('#EAD9B8').stroke();
      y += 18;

      doc.font('Helvetica').fontSize(8).fillColor('#2D1F0E');

      items.forEach((item, index) => {
        if (y > 750) {
          doc.addPage();
          y = 40;
        }

        doc.text((index + 1).toString(), 30, y);
        doc.text(item.fullName.slice(0, 24), 55, y);
        doc.text(item.phone || 'N/A', 190, y);
        doc.text((item.email || 'N/A').slice(0, 26), 310, y);
        doc.text(item.passCode || 'N/A', 470, y);

        y += 15;
      });

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });
  };

  const generateCategoryCsv = (fileName: string, items: any[]) => {
    const csvRows = ['Index,Customer Name,WhatsApp / Phone,Email Address,Pass Category,Pass Code,Status'];
    items.forEach((item, idx) => {
      csvRows.push(`${idx + 1},"${item.fullName}","${item.phone}","${item.email}","${item.passType}","${item.passCode}","${item.status}"`);
    });
    fs.writeFileSync(fileName, csvRows.join('\n'), 'utf-8');
  };

  // 1. Female / Single Customers
  await generateCategoryPdf('SINGLE', 'Safed_Sheri_Female_Single_Customer_Contacts.pdf', 'FEMALE / SINGLE PASS CUSTOMER CONTACTS', categorized.SINGLE);
  generateCategoryCsv('Safed_Sheri_Female_Single_Customer_Contacts.csv', categorized.SINGLE);

  // 2. Couple Customers
  await generateCategoryPdf('COUPLE', 'Safed_Sheri_Couple_Customer_Contacts.pdf', 'COUPLE PASS CUSTOMER CONTACTS', categorized.COUPLE);
  generateCategoryCsv('Safed_Sheri_Couple_Customer_Contacts.csv', categorized.COUPLE);

  // 3. Kids Customers
  await generateCategoryPdf('KIDS', 'Safed_Sheri_Kids_Customer_Contacts.pdf', 'KIDS PASS CUSTOMER CONTACTS', categorized.KIDS);
  generateCategoryCsv('Safed_Sheri_Kids_Customer_Contacts.csv', categorized.KIDS);

  // 4. Gazebo Customers
  await generateCategoryPdf('GAZEBO', 'Safed_Sheri_Gazebo_Customer_Contacts.pdf', 'GAZEBO VIP PASS CUSTOMER CONTACTS', categorized.GAZEBO);
  generateCategoryCsv('Safed_Sheri_Gazebo_Customer_Contacts.csv', categorized.GAZEBO);

  // 5. Master Report
  const allItems = [...categorized.SINGLE, ...categorized.COUPLE, ...categorized.KIDS, ...categorized.GAZEBO];
  await generateCategoryPdf('ALL', 'Safed_Sheri_Master_Customer_Contacts.pdf', 'MASTER CUSTOMER CONTACT REPORT (ALL CATEGORIES)', allItems);
  generateCategoryCsv('Safed_Sheri_Master_Customer_Contacts.csv', allItems);

  console.log('\n🎉 ALL CATEGORY-WISE CONTACT PDFS & CSVS CREATED SUCCESSFULLY!');
  console.log('📁 PDF Files Generated:');
  console.log('  1. Safed_Sheri_Female_Single_Customer_Contacts.pdf');
  console.log('  2. Safed_Sheri_Couple_Customer_Contacts.pdf');
  console.log('  3. Safed_Sheri_Kids_Customer_Contacts.pdf');
  console.log('  4. Safed_Sheri_Gazebo_Customer_Contacts.pdf');
  console.log('  5. Safed_Sheri_Master_Customer_Contacts.pdf\n');
}

async function exportAuditReport() {
  console.log('📊 GENERATING REAL-TIME OCTOBER 9TH AUDIT REPORT...');

  const entries = await prisma.entry.findMany({
    include: {
      attendee: true,
      registration: true,
      credential: true,
      verifiedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const csvRows = [
    'Entry ID,Gate ID,Pass Category,Pass Code,Attendee Name,Phone,Verification Method,Verified By,Timestamp',
  ];

  for (const e of entries) {
    const row = [
      e.id,
      e.gateId || 'GATE_1',
      e.registration?.passType || 'N/A',
      e.credential?.passCode || 'N/A',
      `"${e.attendee?.fullName || 'Direct Walk-in'}"`,
      e.attendee?.phone || 'N/A',
      e.verificationMethod,
      `"${e.verifiedBy?.fullName || 'System'}"`,
      `"${new Date(e.createdAt).toLocaleString()}"`,
    ];
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');
  const filePath = path.join(process.cwd(), 'october9_attendance_report.csv');
  fs.writeFileSync(filePath, csvContent, 'utf-8');

  console.log(`✅ Report exported successfully to: ${filePath}`);
  console.log(`Total verified entries recorded in report: ${entries.length}`);
}

async function main() {
  await printHeader();

  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--diag' || command === 'diag') {
    await runHealthDiagnostic();
  } else if (command === '--inspect' || command === 'inspect') {
    await inspectPass(args[1] || '');
  } else if (command === '--reset' || command === 'reset') {
    await resetPassStatus(args[1] || '');
  } else if (command === '--override' || command === 'override') {
    await forceEmergencyScan(args[1] || '', args[2] || 'MASTER_ADMIN');
  } else if (command === '--clear-test-scans' || command === 'clear-test-scans') {
    await clearTestScans();
  } else if (command === '--export-customer-pdf' || command === 'export-customer-pdf') {
    await exportCustomerContactsPdf();
  } else if (command === '--export' || command === 'export') {
    await exportAuditReport();
  } else {
    await runHealthDiagnostic();

    console.log('\n💡 AVAILABLE SCRIPT CLI COMMANDS:');
    console.log('  - Run Diagnostic:           npx ts-node scripts/october9_event_master.ts --diag');
    console.log('  - Inspect Pass:             npx ts-node scripts/october9_event_master.ts --inspect <PASS_CODE_OR_PHONE>');
    console.log('  - Reset Pass to Active:     npx ts-node scripts/october9_event_master.ts --reset <PASS_CODE>');
    console.log('  - Force Emergency Scan:     npx ts-node scripts/october9_event_master.ts --override <PASS_CODE> [GATE_ID]');
    console.log('  - Clear Test Scans to 0:    npx ts-node scripts/october9_event_master.ts --clear-test-scans');
    console.log('  - Export Customer PDFs:     npx ts-node scripts/october9_event_master.ts --export-customer-pdf');
    console.log('  - Export Gate Audit CSV:    npx ts-node scripts/october9_event_master.ts --export\n');
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
