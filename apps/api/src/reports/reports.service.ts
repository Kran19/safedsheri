import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const activeEvent = await this.prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });

    const totalRegistrations = await this.prisma.registration.count();
    const paidRegistrations = await this.prisma.registration.count({
      where: { status: 'PAYMENT_CONFIRMED' },
    });
    const pendingRegistrations = await this.prisma.registration.count({
      where: { status: 'PENDING_PAYMENT' },
    });

    const paymentAggregate = await this.prisma.payment.aggregate({
      _sum: { amount: true },
    });
    const totalCollection = paymentAggregate._sum.amount || 0;

    const totalEntries = await this.prisma.entry.count();
    const directEntries = await this.prisma.entry.count({
      where: { entryType: 'DIRECT' },
    });
    const qrEntries = await this.prisma.entry.count({
      where: { entryType: 'QR' },
    });

    const totalScans = await this.prisma.scanAttempt.count();
    const validScans = await this.prisma.scanAttempt.count({
      where: { result: 'VALID' },
    });
    const alreadyUsedScans = await this.prisma.scanAttempt.count({
      where: { result: 'ALREADY_USED' },
    });

    return {
      success: true,
      data: {
        event: activeEvent
          ? { name: activeEvent.name, date: activeEvent.eventDate }
          : { name: 'Safed Sheri 2026', date: '2026-10-09' },
        registrations: {
          total: totalRegistrations,
          paid: paidRegistrations,
          pending: pendingRegistrations,
        },
        financials: {
          totalCollection,
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

    const paymentsByLocation = await this.prisma.payment.groupBy({
      by: ['paymentLocationId'],
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      success: true,
      data: {
        byMethod: paymentsByMethod,
        byLocation: paymentsByLocation,
      },
    };
  }
}
