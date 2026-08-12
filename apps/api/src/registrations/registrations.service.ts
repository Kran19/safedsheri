import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus } from '@prisma/client';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class RegistrationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async getActivePhase() {
    const phase = await this.prisma.pricingPhase.findFirst({
      where: { isActive: true },
    });
    if (!phase) {
      throw new NotFoundException('No active pricing phase configured');
    }
    return {
      success: true,
      data: {
        id: phase.id,
        phaseName: phase.phaseName,
        singlePrice: Number(phase.singlePrice),
        couplePrice: Number(phase.couplePrice),
      },
    };
  }

  async getAllPhases() {
    const phases = await this.prisma.pricingPhase.findMany({
      orderBy: { phaseName: 'asc' },
    });
    return { success: true, data: phases };
  }

  async setActivePhase(phaseId: string, actorId: string) {
    const targetPhase = await this.prisma.pricingPhase.findUnique({
      where: { id: phaseId },
    });
    if (!targetPhase) {
      throw new NotFoundException('Pricing phase not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pricingPhase.updateMany({
        data: { isActive: false },
      });

      await tx.pricingPhase.update({
        where: { id: phaseId },
        data: { isActive: true },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'PRICING_PHASE_CHANGED',
          targetEntity: 'PricingPhase',
          targetId: phaseId,
          payload: { phaseName: targetPhase.phaseName },
        },
      });
    });

    return {
      success: true,
      data: targetPhase,
      message: `Active pricing phase changed to ${targetPhase.phaseName}`,
    };
  }

  async createPublicRegistration(data: {
    passType: 'SINGLE' | 'COUPLE';
    attendees: Array<{
      fullName: string;
      phone: string;
      email?: string;
      aadhaarNumber: string;
    }>;
  }) {
    const activeEvent = await this.prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });
    if (!activeEvent) {
      throw new BadRequestException('No active Safed Sheri event found');
    }

    const activePhase = await this.prisma.pricingPhase.findFirst({
      where: { isActive: true },
    });
    if (!activePhase) {
      throw new BadRequestException('No active pricing phase configured');
    }

    if (!data.attendees || data.attendees.length === 0) {
      throw new BadRequestException('At least one attendee is required');
    }

    if (data.passType === 'COUPLE' && data.attendees.length < 2) {
      throw new BadRequestException('Couple pass requires exactly 2 attendee records');
    }

    const amountDue = data.passType === 'COUPLE' ? Number(activePhase.couplePrice) : Number(activePhase.singlePrice);

    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    const count = await this.prisma.registration.count();
    const seq = (count + 101).toString().padStart(6, '0');
    const registrationNumber = `SS-2026-${seq}`;

    const registration = await this.prisma.$transaction(async (tx) => {
      const createdReg = await tx.registration.create({
        data: {
          registrationNumber,
          eventId: activeEvent.id,
          pricingPhaseId: activePhase.id,
          amountDue,
          status: RegistrationStatus.PENDING_PAYMENT,
          createdById: adminUser ? adminUser.id : activeEvent.id,
        },
      });

      for (let i = 0; i < data.attendees.length; i++) {
        const attData = data.attendees[i];
        if (!attData.aadhaarNumber || attData.aadhaarNumber.trim().length < 12) {
          throw new BadRequestException(`Valid 12-digit Aadhaar number is mandatory for attendee ${attData.fullName}`);
        }

        const aadhaarMasked = this.encryptionService.maskAadhaar(attData.aadhaarNumber);
        const aadhaarEncrypted = this.encryptionService.encrypt(attData.aadhaarNumber);

        const attendee = await tx.attendee.create({
          data: {
            fullName: attData.fullName,
            phone: attData.phone,
            email: attData.email,
            aadhaarMasked,
            aadhaarEncrypted,
          },
        });

        await tx.registrationAttendee.create({
          data: {
            registrationId: createdReg.id,
            attendeeId: attendee.id,
            isPrimary: i === 0,
          },
        });
      }

      return tx.registration.findUnique({
        where: { id: createdReg.id },
        include: {
          pricingPhase: true,
          attendees: { include: { attendee: { select: { id: true, fullName: true, phone: true, aadhaarMasked: true } } } },
        },
      });
    });

    return {
      success: true,
      data: {
        registrationNumber: registration.registrationNumber,
        status: registration.status,
        amountDue: Number(registration.amountDue),
        phaseName: registration.pricingPhase.phaseName,
        passType: data.passType,
        attendeesCount: registration.attendees.length,
        hasActivePass: false,
        cashCounterInstructions:
          'Your place is reserved under state PAYMENT_PENDING. Please visit a designated physical Safed Sheri cash counter with your booking reference to complete cash payment and activate your digital pass.',
      },
      message: `Booking ${registrationNumber} created successfully! NO ACTIVE PASS HAS BEEN ISSUED YET. Complete cash payment at designated counter to activate pass.`,
    };
  }

  async findAll(search?: string, status?: RegistrationStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { attendees: { some: { attendee: { fullName: { contains: search, mode: 'insensitive' } } } } },
        { attendees: { some: { attendee: { phone: { contains: search } } } } },
      ];
    }

    const registrations = await this.prisma.registration.findMany({
      where,
      include: {
        pricingPhase: true,
        attendees: {
          include: {
            attendee: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                aadhaarMasked: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            receiptNumber: true,
            createdAt: true,
          },
        },
        credentials: {
          select: {
            id: true,
            credentialNumber: true,
            secureToken: true,
            status: true,
            usedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { success: true, data: registrations };
  }

  async findOne(id: string) {
    const registration = await this.prisma.registration.findFirst({
      where: {
        OR: [{ id }, { registrationNumber: id }],
      },
      include: {
        pricingPhase: true,
        attendees: { include: { attendee: true } },
        payments: true,
        credentials: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    return { success: true, data: registration };
  }

  async create(data: {
    passType: 'SINGLE' | 'COUPLE';
    attendees: Array<{
      fullName: string;
      phone: string;
      email?: string;
      aadhaarNumber: string;
    }>;
    createdById: string;
  }) {
    const activeEvent = await this.prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });
    if (!activeEvent) {
      throw new BadRequestException('No active Safed Sheri event found');
    }

    const activePhase = await this.prisma.pricingPhase.findFirst({
      where: { isActive: true },
    });
    if (!activePhase) {
      throw new BadRequestException('No active pricing phase configured');
    }

    if (!data.attendees || data.attendees.length === 0) {
      throw new BadRequestException('At least one attendee is required');
    }

    if (data.passType === 'COUPLE' && data.attendees.length < 2) {
      throw new BadRequestException('Couple pass requires exactly 2 attendee records');
    }

    const amountDue = data.passType === 'COUPLE' ? Number(activePhase.couplePrice) : Number(activePhase.singlePrice);

    const count = await this.prisma.registration.count();
    const seq = (count + 101).toString().padStart(6, '0');
    const registrationNumber = `SS-2026-${seq}`;

    const registration = await this.prisma.$transaction(async (tx) => {
      const createdReg = await tx.registration.create({
        data: {
          registrationNumber,
          eventId: activeEvent.id,
          pricingPhaseId: activePhase.id,
          amountDue,
          status: RegistrationStatus.PENDING_PAYMENT,
          createdById: data.createdById,
        },
      });

      for (let i = 0; i < data.attendees.length; i++) {
        const attData = data.attendees[i];
        if (!attData.aadhaarNumber || attData.aadhaarNumber.trim().length === 0) {
          throw new BadRequestException(`Aadhaar number is mandatory for attendee ${attData.fullName}`);
        }

        const aadhaarMasked = this.encryptionService.maskAadhaar(attData.aadhaarNumber);
        const aadhaarEncrypted = this.encryptionService.encrypt(attData.aadhaarNumber);

        const attendee = await tx.attendee.create({
          data: {
            fullName: attData.fullName,
            phone: attData.phone,
            email: attData.email,
            aadhaarMasked,
            aadhaarEncrypted,
          },
        });

        await tx.registrationAttendee.create({
          data: {
            registrationId: createdReg.id,
            attendeeId: attendee.id,
            isPrimary: i === 0,
          },
        });
      }

      return tx.registration.findUnique({
        where: { id: createdReg.id },
        include: {
          pricingPhase: true,
          attendees: { include: { attendee: true } },
        },
      });
    });

    return {
      success: true,
      data: registration,
      message: `Registration ${registrationNumber} created successfully (Status: PENDING_PAYMENT)`,
    };
  }

  async cancel(id: string, actorId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: { credentials: true },
    });
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const reg = await tx.registration.update({
        where: { id },
        data: { status: RegistrationStatus.CANCELLED },
      });

      if (registration.credentials && registration.credentials.length > 0) {
        for (const cred of registration.credentials) {
          await tx.credential.update({
            where: { id: cred.id },
            data: { status: 'CANCELLED' },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'REGISTRATION_CANCELLED',
          targetEntity: 'Registration',
          targetId: id,
        },
      });

      return reg;
    });

    return { success: true, data: updated, message: 'Registration cancelled successfully' };
  }
}
