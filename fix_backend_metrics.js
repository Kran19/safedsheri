const fs = require('fs');

const reportsFile = 'd:/safedsheri/apps/api/src/reports/reports.service.ts';
let reportsContent = fs.readFileSync(reportsFile, 'utf8');

// Attendees
reportsContent = reportsContent.replace(
  `const totalAttendees = await this.prisma.attendee.count();`,
  `const totalAttendees = await this.prisma.attendee.count({\n      where: {\n        registrations: {\n          some: { registration: { deletedAt: null } }\n        }\n      }\n    });`
);

// Payments
reportsContent = reportsContent.replace(
  `where: { status: PaymentStatus.CONFIRMED },`,
  `where: { status: PaymentStatus.CONFIRMED, registration: { deletedAt: null } },`
);

// Entries
reportsContent = reportsContent.replace(
  `const totalEntries = await this.prisma.entry.count();`,
  `const totalEntries = await this.prisma.entry.count({\n      where: { registration: { deletedAt: null } }\n    });`
);
reportsContent = reportsContent.replace(
  `where: { entryType: 'QR' },`,
  `where: { entryType: 'QR', registration: { deletedAt: null } },`
);
reportsContent = reportsContent.replace(
  `where: { entryType: 'DIRECT' },`,
  `where: { entryType: 'DIRECT', registration: { deletedAt: null } },`
);

// Scans
reportsContent = reportsContent.replace(
  `const totalScans = await this.prisma.scanAttempt.count();`,
  `const totalScans = await this.prisma.scanAttempt.count({\n      where: { credential: { registration: { deletedAt: null } } }\n    });`
);
reportsContent = reportsContent.replace(
  `where: { result: ScanResult.VALID },`,
  `where: { result: ScanResult.VALID, credential: { registration: { deletedAt: null } } },`
);
reportsContent = reportsContent.replace(
  `where: { result: ScanResult.ALREADY_USED },`,
  `where: { result: ScanResult.ALREADY_USED, credential: { registration: { deletedAt: null } } },`
);

fs.writeFileSync(reportsFile, reportsContent);
console.log('Backend metrics patched for deletedAt');
