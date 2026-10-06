import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, PassType, PaymentStatus, ScanResult } from '@prisma/client';

const PDFDocument = require('pdfkit');

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
          passType: pt,
          registrationNumber: reg.registrationNumber,
          passCode: reg.credentials?.[0]?.passCode || 'N/A',
          status: reg.status,
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
}
