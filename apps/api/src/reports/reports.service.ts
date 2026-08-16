import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, PassType, PaymentStatus, ScanResult } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const activeEvent = await this.prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });

    const totalRegistrations = await this.prisma.registration.count();
    const pendingReview = await this.prisma.registration.count({
      where: {
        status: { in: [RegistrationStatus.SUBMITTED, RegistrationStatus.UNDER_REVIEW] },
      },
    });
    const approved = await this.prisma.registration.count({
      where: { status: RegistrationStatus.APPROVED },
    });
    const paymentPending = await this.prisma.registration.count({
      where: { status: RegistrationStatus.PAYMENT_PENDING },
    });
    const paidRegistrations = await this.prisma.registration.count({
      where: {
        status: { in: [RegistrationStatus.PAYMENT_CONFIRMED, RegistrationStatus.PASS_ISSUED] },
      },
    });
    const passesIssued = await this.prisma.registration.count({
      where: { status: RegistrationStatus.PASS_ISSUED },
    });
    const rejected = await this.prisma.registration.count({
      where: { status: RegistrationStatus.REJECTED },
    });
    const cancelled = await this.prisma.registration.count({
      where: { status: RegistrationStatus.CANCELLED },
    });

    const femaleSinglePasses = await this.prisma.registration.count({
      where: { passType: PassType.SINGLE },
    });
    const couplePasses = await this.prisma.registration.count({
      where: { passType: PassType.COUPLE },
    });
    const gazeboBookings = await this.prisma.registration.count({
      where: { passType: PassType.GAZEBO },
    });

    const totalAttendees = await this.prisma.attendee.count();

    const paymentAggregate = await this.prisma.payment.aggregate({
      where: { status: PaymentStatus.CONFIRMED },
      _sum: { amount: true },
    });
    const totalCollection = paymentAggregate._sum.amount || 0;

    const totalEntries = await this.prisma.entry.count();
    const qrEntries = await this.prisma.entry.count({
      where: { entryType: 'QR' },
    });
    const directEntries = await this.prisma.entry.count({
      where: { entryType: 'DIRECT' },
    });

    const totalScans = await this.prisma.scanAttempt.count();
    const validScans = await this.prisma.scanAttempt.count({
      where: { result: ScanResult.VALID },
    });
    const alreadyUsedScans = await this.prisma.scanAttempt.count({
      where: { result: ScanResult.ALREADY_USED },
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
}
