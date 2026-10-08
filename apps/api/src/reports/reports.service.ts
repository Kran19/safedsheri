import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, PassType, PaymentStatus, ScanResult } from '@prisma/client';

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const activeEvent = await this.prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });

    const totalRegistrations = await this.prisma.registration.count({
      where: { deletedAt: null },
    });
    const pendingReview = await this.prisma.registration.count({
      where: {
        status: { in: [RegistrationStatus.SUBMITTED, RegistrationStatus.UNDER_REVIEW] },
        deletedAt: null,
      },
    });
    const approved = await this.prisma.registration.count({
      where: { status: RegistrationStatus.APPROVED, deletedAt: null },
    });
    const paymentPending = await this.prisma.registration.count({
      where: { status: RegistrationStatus.PAYMENT_PENDING, deletedAt: null },
    });
    const processing = await this.prisma.registration.count({
      where: {
        status: { in: [RegistrationStatus.APPROVED, RegistrationStatus.CASHIER_PENDING, RegistrationStatus.PAYMENT_CONFIRMED, RegistrationStatus.PAYMENT_FAILED] },
        deletedAt: null,
      },
    });
    const paidRegistrations = await this.prisma.registration.count({
      where: {
        status: { in: [RegistrationStatus.PAYMENT_CONFIRMED, RegistrationStatus.PASS_ISSUED] },
        deletedAt: null,
      },
    });
    const passesIssued = await this.prisma.registration.count({
      where: { status: RegistrationStatus.PASS_ISSUED, deletedAt: null },
    });
    const rejected = await this.prisma.registration.count({
      where: { status: RegistrationStatus.REJECTED, deletedAt: null },
    });
    const cancelled = await this.prisma.registration.count({
      where: { status: RegistrationStatus.CANCELLED, deletedAt: null },
    });

    const femaleSinglePasses = await this.prisma.registration.count({
      where: { passType: PassType.SINGLE, deletedAt: null },
    });
    const couplePasses = await this.prisma.registration.count({
      where: { passType: PassType.COUPLE, deletedAt: null },
    });
    const gazeboBookings = await this.prisma.registration.count({
      where: { passType: PassType.GAZEBO, deletedAt: null },
    });

    const kidsPasses = await this.prisma.registration.count({
      where: { passType: PassType.KIDS, deletedAt: null },
    });

    const totalAttendees = await this.prisma.attendee.count({
      where: {
        registrations: {
          some: { registration: { deletedAt: null } }
        }
      }
    });

    const paymentAggregate = await this.prisma.payment.aggregate({
      where: { status: PaymentStatus.CONFIRMED, registration: { deletedAt: null } },
      _sum: { amount: true },
    });
    const totalCollection = paymentAggregate._sum.amount || 0;

    const totalEntries = await this.prisma.entry.count({
      where: { registration: { deletedAt: null } }
    });
    const qrEntries = await this.prisma.entry.count({
      where: { entryType: 'QR', registration: { deletedAt: null } },
    });
    const directEntries = await this.prisma.entry.count({
      where: { entryType: 'DIRECT', registration: { deletedAt: null } },
    });

    const allEntries = await this.prisma.entry.findMany({
      where: { registration: { deletedAt: null } },
      select: {
        registration: { select: { passType: true } },
        credential: { select: { registration: { select: { passType: true } } } },
        notes: true,
      },
    });

    let coupleScanned = 0;
    let singleScanned = 0;
    let kidsScanned = 0;
    let gazeboScanned = 0;

    for (const e of allEntries) {
      let pt = e.registration?.passType || e.credential?.registration?.passType;
      if (!pt && e.notes) {
        const n = e.notes.toUpperCase();
        if (n.includes('COUPLE')) pt = PassType.COUPLE;
        else if (n.includes('SINGLE') || n.includes('FEMALE')) pt = PassType.SINGLE;
        else if (n.includes('KIDS')) pt = PassType.KIDS;
        else if (n.includes('GAZEBO')) pt = PassType.GAZEBO;
      }
      if (!pt) pt = PassType.COUPLE;

      if (pt === PassType.COUPLE) coupleScanned++;
      else if (pt === PassType.SINGLE) singleScanned++;
      else if (pt === PassType.KIDS) kidsScanned++;
      else if (pt === PassType.GAZEBO) gazeboScanned++;
    }

    const totalScans = await this.prisma.scanAttempt.count({
      where: { credential: { registration: { deletedAt: null } } }
    });
    const validScans = await this.prisma.scanAttempt.count({
      where: { result: ScanResult.VALID, credential: { registration: { deletedAt: null } } },
    });
    const alreadyUsedScans = await this.prisma.scanAttempt.count({
      where: { result: ScanResult.ALREADY_USED, credential: { registration: { deletedAt: null } } },
    });

    return {
      success: true,
      data: {
        event: activeEvent
          ? { name: activeEvent.name, date: activeEvent.eventDate }
          : { name: 'Safed Sheri 2026', date: '2026-10-09' },
        applications: {
          total: totalRegistrations,
          pendingReview,
          approved,
          paymentPending,
          processing,
          paid: paidRegistrations,
          passesIssued,
          rejected,
          cancelled,
        },
        passTypes: {
          single: femaleSinglePasses,
          couple: couplePasses,
          kids: kidsPasses,
          gazebo: gazeboBookings,
          totalAttendees,
        },
        financials: {
          totalCollection: Number(totalCollection),
        },
        entries: {
          total: totalEntries,
          qr: qrEntries,
          direct: directEntries,
          breakdown: {
            couple: coupleScanned,
            single: singleScanned,
            kids: kidsScanned,
            gazebo: gazeboScanned,
          },
          metrics: {
            COUPLE: {
              issued: couplePasses,
              scanned: coupleScanned,
              remaining: Math.max(0, couplePasses - coupleScanned),
            },
            SINGLE: {
              issued: femaleSinglePasses,
              scanned: singleScanned,
              remaining: Math.max(0, femaleSinglePasses - singleScanned),
            },
            KIDS: {
              issued: kidsPasses,
              scanned: kidsScanned,
              remaining: Math.max(0, kidsPasses - kidsScanned),
            },
            GAZEBO: {
              issued: gazeboBookings,
              scanned: gazeboScanned,
              remaining: Math.max(0, gazeboBookings - gazeboScanned),
            },
          },
        },
        scans: {
          total: totalScans,
          valid: validScans,
          duplicateAttempts: alreadyUsedScans,
        },
      },
    };
  }

  async getPaymentsReport() {
    const paymentsByMethod = await this.prisma.payment.groupBy({
      by: ['method'],
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      success: true,
      data: {
        byMethod: paymentsByMethod,
      },
    };
  }

  async getCustomerContacts(category?: string) {
    const where: any = { deletedAt: null };
    if (category && category !== 'ALL') {
      where.passType = category as PassType;
    }

    const registrations = await this.prisma.registration.findMany({
      where,
      include: {
        attendees: {
          include: { attendee: true },
        },
        credentials: {
          select: { passCode: true, credentialNumber: true },
        },
        createdBy: {
          select: { username: true, fullName: true },
        },
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

        const contact = {
          fullName: att.fullName,
          phone: att.phone,
          email: email,
          gender: att.gender || 'N/A',
          passType: pt,
          registrationNumber: reg.registrationNumber,
          passCode: reg.credentials?.[0]?.passCode || 'N/A',
          status: reg.status,
          createdAt: reg.createdAt,
        };

        if (categorized[pt]) {
          categorized[pt].push(contact);
        } else {
          categorized.SINGLE.push(contact);
        }
      }
    }

    return categorized;
  }

  async generateCustomerContactsPdf(category: string = 'ALL'): Promise<Buffer> {
    const categorizedData = await this.getCustomerContacts(category);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: any) => reject(err));

      const categoryTitles: Record<string, string> = {
        SINGLE: 'FEMALE / SINGLE PASS CUSTOMER CONTACT REPORT',
        COUPLE: 'COUPLE PASS CUSTOMER CONTACT REPORT',
        KIDS: 'KIDS PASS CUSTOMER CONTACT REPORT',
        GAZEBO: 'GAZEBO VIP PASS CUSTOMER CONTACT REPORT',
        ALL: 'MASTER CUSTOMER CONTACT REPORT (ALL CATEGORIES)',
      };

      const reportTitle = categoryTitles[category] || 'CUSTOMER CONTACT REPORT';

      doc.fontSize(18).fillColor('#2D1F0E').text('SAFED SHERI 2026', { align: 'center' });
      doc.fontSize(12).fillColor('#8C6019').text(reportTitle, { align: 'center' });
      doc.fontSize(9).fillColor('#6E5336').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);

      const renderCategorySection = (catKey: string, catTitle: string, items: any[]) => {
        if (items.length === 0) return;

        doc.fontSize(12).fillColor('#2D1F0E').font('Helvetica-Bold').text(`${catTitle} (Total: ${items.length})`);
        doc.moveDown(0.3);

        const tableTop = doc.y;
        doc.fontSize(8).fillColor('#8C6019').font('Helvetica-Bold');
        doc.text('#', 30, tableTop);
        doc.text('Customer Name', 55, tableTop);
        doc.text('WhatsApp / Phone', 190, tableTop);
        doc.text('Email Address', 310, tableTop);
        doc.text('Pass Code', 470, tableTop);

        doc.moveTo(30, tableTop + 12).lineTo(565, tableTop + 12).strokeColor('#EAD9B8').stroke();

        let y = tableTop + 18;
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

        doc.moveDown(1.5);
      };

      if (category === 'ALL') {
        renderCategorySection('SINGLE', '👩 FEMALE / SINGLE PASS CUSTOMERS', categorizedData.SINGLE);
        renderCategorySection('COUPLE', '👫 COUPLE PASS CUSTOMERS', categorizedData.COUPLE);
        renderCategorySection('KIDS', '👶 KIDS PASS CUSTOMERS', categorizedData.KIDS);
        renderCategorySection('GAZEBO', '🎪 GAZEBO VIP CUSTOMERS', categorizedData.GAZEBO);
      } else {
        const catItems = categorizedData[category] || [];
        renderCategorySection(category, reportTitle, catItems);
      }

      doc.end();
    });
  }

  async generateCustomerContactsExcel(category: string = 'ALL'): Promise<Buffer> {
    const categorizedData = await this.getCustomerContacts(category);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Safed Sheri 2026';
    workbook.created = new Date();

    const addSheetWithData = (sheetName: string, title: string, items: any[]) => {
      const sheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }],
      });

      // Title row
      sheet.mergeCells('A1:I1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `SAFED SHERI 2026 - ${title.toUpperCase()}`;
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D1F0E' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 30;

      // Subtitle / generated timestamp
      sheet.mergeCells('A2:I2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Total Records: ${items.length} | Generated: ${new Date().toLocaleString('en-IN')}`;
      subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF8C6019' } };
      subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5DC' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 20;

      // Blank separator row
      sheet.getRow(3).height = 10;

      // Header row
      const headers = [
        { header: '#', key: 'sr', width: 6 },
        { header: 'Customer Name', key: 'fullName', width: 28 },
        { header: 'WhatsApp / Mobile', key: 'phone', width: 18 },
        { header: 'Email Address', key: 'email', width: 32 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Pass Category', key: 'passType', width: 16 },
        { header: 'Registration ID', key: 'registrationNumber', width: 20 },
        { header: 'Pass Code', key: 'passCode', width: 22 },
        { header: 'Status', key: 'status', width: 16 },
      ];

      const headerRow = sheet.getRow(4);
      headerRow.values = headers.map((h: any) => h.header);
      headerRow.height = 25;
      headerRow.eachCell((cell: any) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8C6019' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEAD9B8' } },
          bottom: { style: 'medium', color: { argb: 'FF2D1F0E' } },
          left: { style: 'thin', color: { argb: 'FFEAD9B8' } },
          right: { style: 'thin', color: { argb: 'FFEAD9B8' } },
        };
      });

      // Data rows
      items.forEach((item: any, index: number) => {
        const row = sheet.addRow([
          index + 1,
          item.fullName || 'N/A',
          item.phone || 'N/A',
          item.email || 'N/A',
          item.gender || 'N/A',
          item.passType || 'N/A',
          item.registrationNumber || 'N/A',
          item.passCode || 'N/A',
          item.status || 'N/A',
        ]);
        row.height = 20;

        const isEven = index % 2 === 0;
        const rowBg = isEven ? 'FFFFFFFF' : 'FFFAF6EE';

        row.eachCell((cell: any, colNumber: number) => {
          cell.font = { name: 'Arial', size: 9 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 1 || colNumber === 5 || colNumber === 6 || colNumber === 9 ? 'center' : 'left',
          };
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFEAD9B8' } },
            left: { style: 'thin', color: { argb: 'FFEAD9B8' } },
            right: { style: 'thin', color: { argb: 'FFEAD9B8' } },
          };
        });
      });

      // Set explicit column widths
      headers.forEach((h: any, i: number) => {
        sheet.getColumn(i + 1).width = h.width;
      });
    };

    if (category === 'ALL') {
      const allItems = [
        ...categorizedData.SINGLE,
        ...categorizedData.COUPLE,
        ...categorizedData.KIDS,
        ...categorizedData.GAZEBO,
      ];
      addSheetWithData('All Contacts', 'All Customer Contacts', allItems);
      addSheetWithData('Single Pass', 'Female / Single Pass Customers', categorizedData.SINGLE);
      addSheetWithData('Couple Pass', 'Couple Pass Customers', categorizedData.COUPLE);
      addSheetWithData('Kids Pass', 'Kids Pass Customers', categorizedData.KIDS);
      addSheetWithData('Gazebo VIP', 'Gazebo VIP Customers', categorizedData.GAZEBO);
    } else {
      const items = categorizedData[category] || [];
      addSheetWithData(category, `${category} Customer Contacts`, items);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
