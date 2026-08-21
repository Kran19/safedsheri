import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, PassType, Gender } from '@prisma/client';
import { EncryptionService } from '../common/encryption.service';
import { PaymentGatewayService } from '../payments/payment-gateway.service';

@Injectable()
export class RegistrationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private paymentGatewayService: PaymentGatewayService,
  ) {}

  async getActivePhase() {
    let phase = await this.prisma.pricingPhase.findFirst({
      where: { isActive: true },
    });
    if (!phase) {
      phase = await this.prisma.pricingPhase.create({
        data: {
          phaseName: 'EARLY_BIRD',
          singlePrice: 3500,
          couplePrice: 6500,
          nextSinglePrice: 6500,
          nextCouplePrice: 12000,
          showSinglePrice: true,
          showCouplePrice: true,
          showGazeboPrice: false,
          isCountdownActive: true,
          countdownTarget: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          urgencyTagline: 'Early Bird Phase Ending Soon — Lock in Your Passes Before Price Hike!',
          hiddenPriceLabel: 'Price Revealed on Approval',
          isActive: true,
        },
      });
    }
    return {
      success: true,
      data: {
        id: phase.id,
        phaseName: phase.phaseName,
        singlePrice: Number(phase.singlePrice),
        couplePrice: Number(phase.couplePrice),
        nextSinglePrice: phase.nextSinglePrice ? Number(phase.nextSinglePrice) : null,
        nextCouplePrice: phase.nextCouplePrice ? Number(phase.nextCouplePrice) : null,
        showSinglePrice: phase.showSinglePrice,
        showCouplePrice: phase.showCouplePrice,
        showGazeboPrice: phase.showGazeboPrice,
        isCountdownActive: phase.isCountdownActive,
        countdownTarget: phase.countdownTarget,
        urgencyTagline: phase.urgencyTagline || 'Early Bird Phase Ending Soon — Lock in Your Passes Before Price Hike!',
        hiddenPriceLabel: phase.hiddenPriceLabel || 'Price Revealed on Approval',
      },
    };
  }

  async getAllPhases() {
    const phases = await this.prisma.pricingPhase.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: phases };
  }

  async updatePricingSettings(
    data: {
      phaseName?: string;
      singlePrice?: number;
      couplePrice?: number;
      nextSinglePrice?: number;
      nextCouplePrice?: number;
      showSinglePrice?: boolean;
      showCouplePrice?: boolean;
      showGazeboPrice?: boolean;
      isCountdownActive?: boolean;
      countdownTarget?: string | Date;
      urgencyTagline?: string;
      hiddenPriceLabel?: string;
    },
    adminId?: string,
  ) {
    let activePhase = await this.prisma.pricingPhase.findFirst({
      where: { isActive: true },
    });

    if (!activePhase) {
      activePhase = await this.prisma.pricingPhase.create({
        data: {
          phaseName: data.phaseName || 'EARLY_BIRD',
          singlePrice: data.singlePrice || 3500,
          couplePrice: data.couplePrice || 6500,
          isActive: true,
        },
      });
    }

    const updated = await this.prisma.pricingPhase.update({
      where: { id: activePhase.id },
      data: {
        ...(data.phaseName && { phaseName: data.phaseName }),
        ...(data.singlePrice !== undefined && { singlePrice: data.singlePrice }),
        ...(data.couplePrice !== undefined && { couplePrice: data.couplePrice }),
        ...(data.nextSinglePrice !== undefined && { nextSinglePrice: data.nextSinglePrice }),
        ...(data.nextCouplePrice !== undefined && { nextCouplePrice: data.nextCouplePrice }),
        ...(data.showSinglePrice !== undefined && { showSinglePrice: data.showSinglePrice }),
        ...(data.showCouplePrice !== undefined && { showCouplePrice: data.showCouplePrice }),
        ...(data.showGazeboPrice !== undefined && { showGazeboPrice: data.showGazeboPrice }),
        ...(data.isCountdownActive !== undefined && { isCountdownActive: data.isCountdownActive }),
        ...(data.countdownTarget !== undefined && {
          countdownTarget: data.countdownTarget ? new Date(data.countdownTarget) : null,
        }),
        ...(data.urgencyTagline !== undefined && { urgencyTagline: data.urgencyTagline }),
        ...(data.hiddenPriceLabel !== undefined && { hiddenPriceLabel: data.hiddenPriceLabel }),
      },
    });

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'PRICING_SETTINGS_UPDATED',
          targetEntity: 'PricingPhase',
          targetId: updated.id,
          payload: { ...data },
        },
      });
    }

    return {
      success: true,
      data: {
        id: updated.id,
        phaseName: updated.phaseName,
        singlePrice: Number(updated.singlePrice),
        couplePrice: Number(updated.couplePrice),
        nextSinglePrice: updated.nextSinglePrice ? Number(updated.nextSinglePrice) : null,
        nextCouplePrice: updated.nextCouplePrice ? Number(updated.nextCouplePrice) : null,
        showSinglePrice: updated.showSinglePrice,
        showCouplePrice: updated.showCouplePrice,
        showGazeboPrice: updated.showGazeboPrice,
        isCountdownActive: updated.isCountdownActive,
        countdownTarget: updated.countdownTarget,
        urgencyTagline: updated.urgencyTagline,
        hiddenPriceLabel: updated.hiddenPriceLabel,
      },
    };
  }

  async findAll(status?: RegistrationStatus, passType?: PassType, search?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (passType) where.passType = passType;
    if (search) {
      where.OR = [
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        {
          attendees: {
            some: {
              attendee: {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { phone: { contains: search } },
                  { aadhaarMasked: { contains: search } },
                ],
              },
            },
          },
        },
      ];
    }

    const registrations = await this.prisma.registration.findMany({
      where,
      include: {
        pricingPhase: true,
        attendees: {
          include: {
            attendee: {
              include: { document: true },
            },
          },
        },
        payments: true,
        credentials: true,
        reviewedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    return { success: true, data: registrations };
  }

  async findOne(id: string) {
    const registration = await this.prisma.registration.findFirst({
      where: {
        OR: [{ id }, { registrationNumber: id }, { paymentLinkId: id }],
      },
      include: {
        pricingPhase: true,
        attendees: {
          include: {
            attendee: {
              include: { document: true },
            },
          },
        },
        payments: true,
        credentials: true,
        reviewedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration application not found');
    }
    return { success: true, data: registration };
  }

  async createPublicRegistration(data: {
    passType: PassType;
    attendees: Array<{
      fullName: string;
      phone: string;
      email?: string;
      gender: Gender;
      aadhaarNumber: string;
      documentKey: string;
      originalFilename?: string;
      mimeType?: string;
      sizeBytes?: number;
      checksum?: string;
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

    if (data.attendees.length > 7) {
      throw new BadRequestException('A single booking can contain a maximum of 7 passes.');
    }

    // RULE 1: Single Pass strictly for Female attendees only (1 to 7 female passes)
    if (data.passType === PassType.SINGLE) {
      for (let i = 0; i < data.attendees.length; i++) {
        if (data.attendees[i].gender === Gender.MALE) {
          throw new BadRequestException(`Single pass tier is strictly for female attendees. Attendee #${i + 1} (${data.attendees[i].fullName}) must be female.`);
        }
      }
    }

    // RULE 2: Couple Pass requires exactly 2 attendees
    if (data.passType === PassType.COUPLE) {
      if (data.attendees.length !== 2) {
        throw new BadRequestException('Couple Pass requires exactly 2 attendee records');
      }
    }

    // RULE 3 & 4: In-Batch Unique Aadhaar & Duplicate Person Prevention via HMAC
    const batchAadhaarSet = new Set<string>();

    for (let i = 0; i < data.attendees.length; i++) {
      const att = data.attendees[i];
      if (!att.fullName || att.fullName.trim().length < 2) {
        throw new BadRequestException(`Full name is required for attendee #${i + 1}`);
      }
      if (!att.phone || att.phone.trim().length < 10) {
        throw new BadRequestException(`Valid phone number is mandatory for attendee #${i + 1} (${att.fullName})`);
      }
      
      const cleanAadhaar = (att.aadhaarNumber || '').replace(/\D/g, '');
      if (cleanAadhaar.length !== 12) {
        throw new BadRequestException(`Valid 12-digit Aadhaar number is mandatory for attendee #${i + 1} (${att.fullName})`);
      }

      if (batchAadhaarSet.has(cleanAadhaar)) {
        throw new BadRequestException(`Each attendee must have a unique Aadhaar card. Duplicate Aadhaar detected for ${att.fullName}.`);
      }
      batchAadhaarSet.add(cleanAadhaar);

      if (!att.documentKey) {
        throw new BadRequestException(`Mandatory Aadhaar document image/PDF upload missing for attendee #${i + 1} (${att.fullName})`);
      }

      const aadhaarHmac = this.encryptionService.computeAadhaarHmac(cleanAadhaar);

      // Check global DB uniqueness for Aadhaar
      const existingAadhaarAttendee = await this.prisma.attendee.findFirst({
        where: { aadhaarHmac },
        include: {
          registrations: { include: { registration: true } },
        },
      });

      if (existingAadhaarAttendee) {
        const hasActiveRegistration = existingAadhaarAttendee.registrations.some(
          (r) =>
            r.registration.status !== RegistrationStatus.REJECTED &&
            r.registration.status !== RegistrationStatus.CANCELLED &&
            r.registration.status !== RegistrationStatus.PAYMENT_FAILED,
        );
        if (hasActiveRegistration) {
          throw new BadRequestException(`Attendee #${i + 1} (${att.fullName}) is already registered with an active booking using this Aadhaar card. Duplicate passes are strictly not allowed.`);
        }
      }

      // Check global DB uniqueness for Phone
      const existingPhoneAttendee = await this.prisma.attendee.findFirst({
        where: { phone: att.phone },
        include: {
          registrations: { include: { registration: true } },
        },
      });

      if (existingPhoneAttendee) {
        const hasActiveRegistration = existingPhoneAttendee.registrations.some(
          (r) =>
            r.registration.status !== RegistrationStatus.REJECTED &&
            r.registration.status !== RegistrationStatus.CANCELLED &&
            r.registration.status !== RegistrationStatus.PAYMENT_FAILED,
        );
        if (hasActiveRegistration) {
          throw new BadRequestException(`Phone number ${att.phone} is already registered with an active booking. Duplicate passes are strictly not allowed.`);
        }
      }
    }

    // Amount due computation
    const amountDue =
      data.passType === PassType.COUPLE
        ? Number(activePhase.couplePrice) * Math.ceil(data.attendees.length / 2)
        : data.passType === PassType.GAZEBO
        ? 85000
        : Number(activePhase.singlePrice) * data.attendees.length;

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
          passType: data.passType,
          amountDue,
          status: RegistrationStatus.UNDER_REVIEW,
          createdById: adminUser ? adminUser.id : activeEvent.id,
        },
      });

      for (let i = 0; i < data.attendees.length; i++) {
        const attData = data.attendees[i];
        const aadhaarMasked = this.encryptionService.maskAadhaar(attData.aadhaarNumber);
        const aadhaarEncrypted = this.encryptionService.encrypt(attData.aadhaarNumber);
        const aadhaarHmac = this.encryptionService.computeAadhaarHmac(attData.aadhaarNumber);

        // Upsert or create attendee
        const attendee = await tx.attendee.upsert({
          where: { aadhaarHmac },
          update: {
            fullName: attData.fullName,
            phone: attData.phone,
            email: attData.email || null,
            gender: attData.gender,
            aadhaarMasked,
            aadhaarEncrypted,
          },
          create: {
            fullName: attData.fullName,
            phone: attData.phone,
            email: attData.email || null,
            gender: attData.gender,
            aadhaarHmac,
            aadhaarMasked,
            aadhaarEncrypted,
          },
        });

        // Upsert document record
        await tx.aadhaarDocument.upsert({
          where: { attendeeId: attendee.id },
          update: {
            storageKey: attData.documentKey,
            originalFilename: attData.originalFilename || 'aadhaar_doc.jpg',
            mimeType: attData.mimeType || 'image/jpeg',
            sizeBytes: attData.sizeBytes || 1024,
            checksum: attData.checksum || 'sha256_checksum',
          },
          create: {
            attendeeId: attendee.id,
            storageKey: attData.documentKey,
            originalFilename: attData.originalFilename || 'aadhaar_doc.jpg',
            mimeType: attData.mimeType || 'image/jpeg',
            sizeBytes: attData.sizeBytes || 1024,
            checksum: attData.checksum || 'sha256_checksum',
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

      await tx.auditLog.create({
        data: {
          actorId: adminUser ? adminUser.id : activeEvent.id,
          action: 'APPLICATION_SUBMITTED',
          targetEntity: 'Registration',
          targetId: createdReg.id,
          payload: {
            registrationNumber,
            passType: data.passType,
            attendeesCount: data.attendees.length,
            amountDue,
          },
        },
      });

      return createdReg;
    });

    return {
      success: true,
      data: {
        id: registration.id,
        registrationNumber: registration.registrationNumber,
        passType: registration.passType,
        status: registration.status,
        amountDue: Number(registration.amountDue),
        attendeesCount: data.attendees.length,
        message: 'Your registration application has been submitted for review by Safed Sheri executive team.',
      },
    };
  }

  async reviewRegistration(
    id: string,
    adminId: string,
    data: {
      globalNotes?: string;
      attendeeDecisions?: Array<{
        attendeeId: string;
        status: RegistrationStatus;
        reviewNotes?: string;
      }>;
    },
  ) {
    const reg = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        attendees: { include: { attendee: true } },
        pricingPhase: true,
      },
    });

    if (!reg) {
      throw new NotFoundException('Registration application not found');
    }

    const decisions = data.attendeeDecisions || [];

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update each RegistrationAttendee record with its individual status & reviewNotes
      for (const d of decisions) {
        await tx.registrationAttendee.updateMany({
          where: {
            registrationId: id,
            attendeeId: d.attendeeId,
          },
          data: {
            status: d.status,
            reviewNotes: d.reviewNotes || data.globalNotes || null,
            reviewedAt: new Date(),
          },
        });
      }

      // 2. Fetch updated attendee records for this registration
      const updatedRegAttendees = await tx.registrationAttendee.findMany({
        where: { registrationId: id },
        include: { attendee: true },
      });

      const approvedAttendees = updatedRegAttendees.filter(
        (ra) =>
          ra.status === RegistrationStatus.APPROVED ||
          ra.status === RegistrationStatus.PASS_ISSUED ||
          ra.status === RegistrationStatus.PAYMENT_PENDING
      );
      const rejectedAttendees = updatedRegAttendees.filter(
        (ra) => ra.status === RegistrationStatus.REJECTED
      );

      const approvedCount = approvedAttendees.length;

      // 3. Case A: ALL attendees rejected
      if (approvedCount === 0) {
        const updated = await tx.registration.update({
          where: { id },
          data: {
            status: RegistrationStatus.REJECTED,
            reviewNotes: data.globalNotes || 'All attendee profiles in this application were rejected.',
            reviewedById: adminId,
            reviewedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: adminId,
            action: 'APPLICATION_REJECTED',
            targetEntity: 'Registration',
            targetId: id,
            payload: {
              registrationNumber: reg.registrationNumber,
              rejectedCount: rejectedAttendees.length,
              globalNotes: data.globalNotes,
              decisions,
            },
          },
        });

        return {
          success: true,
          data: { registration: updated, approvedCount: 0, rejectedCount: rejectedAttendees.length },
          message: 'All attendee profiles rejected. Application marked as REJECTED.',
        };
      }

      // 4. Case B: At least 1 attendee approved (Partial or Full Approval)
      let recalculatedAmount = 0;
      if (reg.passType === PassType.COUPLE) {
        recalculatedAmount = Number(reg.pricingPhase.couplePrice);
      } else {
        recalculatedAmount = Number(reg.pricingPhase.singlePrice) * approvedCount;
      }

      const primaryAttendee =
        approvedAttendees.find((a) => a.isPrimary)?.attendee ||
        approvedAttendees[0]?.attendee ||
        reg.attendees[0]?.attendee;

      // Create / update payment order for the recalculated amount
      const paymentOrder = await this.paymentGatewayService.createPaymentOrder({
        registrationId: reg.id,
        registrationNumber: reg.registrationNumber,
        amount: recalculatedAmount,
        customerName: primaryAttendee?.fullName || 'Guest',
        customerPhone: primaryAttendee?.phone || '',
      });

      const summaryNote =
        rejectedAttendees.length > 0
          ? `${approvedCount} approved, ${rejectedAttendees.length} rejected. (Amount: ₹${recalculatedAmount})`
          : 'All attendees approved by Admin.';

      const updated = await tx.registration.update({
        where: { id },
        data: {
          status: RegistrationStatus.PAYMENT_PENDING,
          amountDue: recalculatedAmount,
          paymentLinkId: paymentOrder.paymentLinkId,
          reviewNotes: data.globalNotes ? `${data.globalNotes} • ${summaryNote}` : summaryNote,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'APPLICATION_APPROVED',
          targetEntity: 'Registration',
          targetId: id,
          payload: {
            registrationNumber: reg.registrationNumber,
            approvedCount,
            rejectedCount: rejectedAttendees.length,
            recalculatedAmount,
            paymentLinkId: paymentOrder.paymentLinkId,
            globalNotes: data.globalNotes,
            decisions,
          },
        },
      });

      return {
        success: true,
        data: {
          registration: updated,
          paymentOrder,
          approvedCount,
          rejectedCount: rejectedAttendees.length,
          recalculatedAmount,
        },
        message: `${approvedCount} attendee(s) approved! Payment order generated for ₹${recalculatedAmount}.`,
      };
    });
  }

  async approveRegistration(id: string, adminId: string, notes?: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id },
      include: { attendees: true },
    });

    if (!reg) {
      throw new NotFoundException('Registration application not found');
    }

    // Default to approving all attendees in this registration
    const attendeeDecisions = reg.attendees.map((a) => ({
      attendeeId: a.attendeeId,
      status: RegistrationStatus.APPROVED,
      reviewNotes: notes,
    }));

    return this.reviewRegistration(id, adminId, {
      globalNotes: notes,
      attendeeDecisions,
    });
  }

  async rejectRegistration(id: string, adminId: string, notes: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id },
      include: { attendees: true },
    });

    if (!reg) {
      throw new NotFoundException('Registration application not found');
    }

    // Default to rejecting all attendees in this registration
    const attendeeDecisions = reg.attendees.map((a) => ({
      attendeeId: a.attendeeId,
      status: RegistrationStatus.REJECTED,
      reviewNotes: notes,
    }));

    return this.reviewRegistration(id, adminId, {
      globalNotes: notes,
      attendeeDecisions,
    });
  }
}
