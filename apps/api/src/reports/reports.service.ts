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
}
