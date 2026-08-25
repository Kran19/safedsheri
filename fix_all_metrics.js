const fs = require('fs');

// 1. Fix backend reports.service.ts to filter out deletedAt from all child relationships
const reportsFile = 'd:/safedsheri/apps/api/src/reports/reports.service.ts';
let reportsContent = fs.readFileSync(reportsFile, 'utf8');

// Attendees
reportsContent = reportsContent.replace(
  `const totalAttendees = await this.prisma.attendee.count();`,
  `const totalAttendees = await this.prisma.attendee.count({\n      where: { registration: { deletedAt: null } }\n    });`
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
  `const totalScans = await this.prisma.scanAttempt.count({\n      where: { registration: { deletedAt: null } }\n    });`
);
reportsContent = reportsContent.replace(
  `where: { result: ScanResult.VALID },`,
  `where: { result: ScanResult.VALID, registration: { deletedAt: null } },`
);
reportsContent = reportsContent.replace(
  `where: { result: ScanResult.ALREADY_USED },`,
  `where: { result: ScanResult.ALREADY_USED, registration: { deletedAt: null } },`
);

fs.writeFileSync(reportsFile, reportsContent);


// 2. Fix page.tsx to ensure loadOverviewData(true) is everywhere
const pageFile = 'd:/safedsheri/apps/admin/app/admin/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');

// handleReject
if (!pageContent.includes(`setMessage('Application rejected.');\n      setSelectedApp(null);\n      setReviewNotes('');\n      loadOverviewData(true);`)) {
  pageContent = pageContent.replace(
    /setMessage\('Application rejected\.'\);\s*setSelectedApp\(null\);\s*setReviewNotes\(''\);\s*const ref/g,
    `setMessage('Application rejected.');\n      setSelectedApp(null);\n      setReviewNotes('');\n      loadOverviewData(true);\n      const ref`
  );
}

// Change loadOverviewData() to loadOverviewData(true) in handleApprove and handleReviewSubmit and handleRestore
pageContent = pageContent.replace(/setReviewNotes\(''\);\s*loadOverviewData\(\);/g, `setReviewNotes('');\n      loadOverviewData(true);`);
pageContent = pageContent.replace(/setAttendeeDecisions\(\{\}\);\s*loadOverviewData\(\);/g, `setAttendeeDecisions({});\n      loadOverviewData(true);`);
pageContent = pageContent.replace(/loadTabContent\('trash'\);\s*loadOverviewData\(\);/g, `loadTabContent('trash');\n      loadOverviewData(true);`);

fs.writeFileSync(pageFile, pageContent);
console.log('Fully dynamic metrics fix complete');
