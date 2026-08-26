import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, PassType, Gender, Role, PaymentStatus, PaymentMethod } from '@prisma/client';
import { EncryptionService } from '../common/encryption.service';
import { PaymentGatewayService } from '../payments/payment-gateway.service';
import { EmailService } from '../common/email.service';
import { PaymentsService } from '../payments/payments.service';
import * as crypto from 'crypto';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private paymentGatewayService: PaymentGatewayService,
    private emailService: EmailService,
    private paymentsService: PaymentsService,
  ) {}

  async generateUniqueRegistrationNumber(tx?: any): Promise<string> {
    const db = tx || this.prisma;
    const count = await db.registration.count();
    let baseSeq = count + 101;

    const latest = await db.registration.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { registrationNumber: true },
    });

    if (latest && latest.registrationNumber) {
      const match = latest.registrationNumber.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num >= baseSeq) {
          baseSeq = num + 1;
        }
      }
    }

    for (let offset = 0; offset < 100; offset++) {
      const seqStr = (baseSeq + offset).toString().padStart(6, '0');
      const candidate = `SS-2026-${seqStr}`;
      const exists = await db.registration.findUnique({
        where: { registrationNumber: candidate },
        select: { id: true },
      });
      if (!exists) {
        return candidate;
      }
    }

    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `SS-2026-${randomHex}`;
  }

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
    const where: any = { deletedAt: null };
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
      kidsAgeGroup?: string;
      dob?: string;
      documentBackKey?: string;
      documentBackName?: string;
      documentBackMimeType?: string;
      documentBackSizeBytes?: number;
      documentBackChecksum?: string;
      ocrExtractedData?: string;
      ocrMismatch?: boolean;
    }>;
  }) {
    try {
      let activeEvent = await this.prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });
    if (!activeEvent) {
      activeEvent = await this.prisma.event.create({
        data: {
          name: 'Safed Sheri 2026',
          eventDate: new Date('2026-10-09T00:00:00.000Z'),
          status: 'ACTIVE',
        },
      });
    }

    let activePhase = await this.prisma.pricingPhase.findFirst({
      where: { isActive: true },
    });
    if (!activePhase) {
      const created = await this.getActivePhase();
      activePhase = await this.prisma.pricingPhase.findUnique({
        where: { id: created.data.id },
      });
    }

    if (!activePhase) {
      throw new BadRequestException('No active pricing phase configured');
    }

    if (!data.attendees || data.attendees.length === 0) {
      throw new BadRequestException('At least one attendee is required');
    }

    if (!data.attendees[0].email) {
      throw new BadRequestException('Primary contact email is mandatory.');
    }



    // RULE 1: Single Pass strictly for 1 Female attendee only
    if (data.passType === PassType.SINGLE) {
      if (data.attendees.length !== 1) {
        throw new BadRequestException('Single Female Pass allows only 1 pass per booking.');
      }
      if (data.attendees[0].gender === Gender.MALE) {
        throw new BadRequestException(`Single pass tier is strictly for female attendees. Attendee (${data.attendees[0].fullName}) must be female.`);
      }
    }

    // RULE 2: Kids Pass strictly for 1 Kid attendee only
    if (data.passType === PassType.KIDS) {
      if (data.attendees.length !== 1) {
        throw new BadRequestException('Kids Pass allows only 1 pass per booking.');
      }
    }

    // RULE 3: Couple Pass requires exactly 2 attendees
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

      if (!att.documentKey || !att.documentBackKey) {
        throw new BadRequestException(`Mandatory Aadhaar document image/PDF upload (Front and Back) missing for attendee #${i + 1} (${att.fullName})`);
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
            r.registration &&
            !r.registration.deletedAt &&
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
            r.registration &&
            !r.registration.deletedAt &&
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
    let amountDue = 0;
    if (data.passType === PassType.COUPLE) {
      amountDue = Number(activePhase.couplePrice) * Math.ceil(data.attendees.length / 2);
    } else if (data.passType === PassType.GAZEBO) {
      amountDue = 85000;
    } else if (data.passType === PassType.KIDS) {
      for (let i = 0; i < data.attendees.length; i++) {
        const att = data.attendees[i];
        if (!att.dob) {
          throw new BadRequestException(`Date of Birth is required for Kids pass for attendee #${i + 1} (${att.fullName})`);
        }
        const dobDate = new Date(att.dob);
        if (isNaN(dobDate.getTime())) {
          throw new BadRequestException(`Invalid Date of Birth for attendee #${i + 1} (${att.fullName})`);
        }
        const diffMs = Date.now() - dobDate.getTime();
        const ageDate = new Date(diffMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        
        if (age > 15) {
          throw new BadRequestException(`Attendee #${i + 1} (${att.fullName}) is ${age} years old. You are not able to book a Kids Pass (Kids Pass is strictly for age 15 and under).`);
        } else if (age > 10 && age <= 15) {
          amountDue += 1200;
        } else {
          amountDue += 0; // Free pass for age <= 10
        }
      }
    } else {
      amountDue = Number(activePhase.singlePrice) * data.attendees.length;
    }

    let adminUser = await this.prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN },
    });

    if (!adminUser) {
      adminUser = await this.prisma.user.findFirst();
    }

    if (!adminUser) {
      const dummyHash = '$2a$10$wT0vR1jB2zOqZ1qC5jK3eu8s3mG4uF0hI9lE7rD5xW1s9mJ2kL3nO';
      adminUser = await this.prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: dummyHash,
          fullName: 'Safed Sheri System Admin',
          role: Role.SUPER_ADMIN,
        },
      });
    }

    const registration = await this.prisma.$transaction(async (tx) => {
      const registrationNumber = await this.generateUniqueRegistrationNumber(tx);
      const createdReg = await tx.registration.create({
        data: {
          registrationNumber,
          eventId: activeEvent.id,
          pricingPhaseId: activePhase.id,
          passType: data.passType,
          amountDue,
          status: RegistrationStatus.UNDER_REVIEW,
          createdById: adminUser.id,
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
            kidsAgeGroup: attData.kidsAgeGroup || null,
            dob: attData.dob ? new Date(attData.dob) : null,
          },
          create: {
            fullName: attData.fullName,
            phone: attData.phone,
            email: attData.email || null,
            gender: attData.gender,
            aadhaarHmac,
            aadhaarMasked,
            aadhaarEncrypted,
            kidsAgeGroup: attData.kidsAgeGroup || null,
            dob: attData.dob ? new Date(attData.dob) : null,
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
            storageKeyBack: attData.documentBackKey || null,
            originalFilenameBack: attData.documentBackName || null,
            mimeTypeBack: attData.documentBackMimeType || null,
            sizeBytesBack: attData.documentBackSizeBytes || null,
            checksumBack: attData.documentBackChecksum || null,
            ocrExtractedData: attData.ocrExtractedData || null,
            ocrMismatch: !!attData.ocrMismatch,
          },
          create: {
            attendeeId: attendee.id,
            storageKey: attData.documentKey,
            originalFilename: attData.originalFilename || 'aadhaar_doc.jpg',
            mimeType: attData.mimeType || 'image/jpeg',
            sizeBytes: attData.sizeBytes || 1024,
            checksum: attData.checksum || 'sha256_checksum',
            storageKeyBack: attData.documentBackKey || null,
            originalFilenameBack: attData.documentBackName || null,
            mimeTypeBack: attData.documentBackMimeType || null,
            sizeBytesBack: attData.documentBackSizeBytes || null,
            checksumBack: attData.documentBackChecksum || null,
            ocrExtractedData: attData.ocrExtractedData || null,
            ocrMismatch: !!attData.ocrMismatch,
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
          actorId: adminUser.id,
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

    // Send Email Notification
    if (data.attendees[0].email) {
      this.emailService.sendRegistrationSubmitted(data.attendees[0].email, registration.registrationNumber).catch(e => console.error(e));
    }

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
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Error creating public registration: ${err.message}`, err.stack);
      throw new BadRequestException(err.message || 'Failed to submit registration. Please try again.');
    }
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
      } else if (reg.passType === PassType.KIDS) {
        recalculatedAmount = approvedAttendees.reduce((sum, ra) => {
          if (ra.attendee.dob) {
            const diffMs = Date.now() - new Date(ra.attendee.dob).getTime();
            const ageDate = new Date(diffMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            if (age >= 10 && age <= 15) return sum + 1200;
            return sum;
          }
          return sum; // Should not happen, but default to 0 if dob missing on approved kids pass
        }, 0);
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

      // Send Approval Email
      const primaryAtt = reg.attendees.find(a => a.isPrimary);
      if (primaryAtt && primaryAtt.attendee.email && paymentOrder) {
        this.emailService.sendRegistrationApproved(
          primaryAtt.attendee.email,
          reg.registrationNumber,
          `http://localhost:3000/order/${paymentOrder.paymentLinkId}`
        ).catch(e => console.error(e));
      }

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

  async getTrash() {
    const registrations = await this.prisma.registration.findMany({
      where: { deletedAt: { not: null } },
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
      orderBy: { deletedAt: 'desc' },
      take: 150,
    });
    return { success: true, data: registrations };
  }

  async softDelete(id: string, adminId: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        payments: {
          where: { status: PaymentStatus.CONFIRMED },
        },
        credentials: true,
      },
    });
    if (!reg) throw new NotFoundException('Registration application not found');

    const isPaid =
      reg.status === RegistrationStatus.PAYMENT_CONFIRMED ||
      reg.status === RegistrationStatus.PASS_ISSUED ||
      (reg.payments && reg.payments.length > 0) ||
      (reg.credentials && reg.credentials.length > 0);

    if (isPaid) {
      const user = await this.prisma.user.findUnique({ where: { id: adminId } });
      if (!user || user.username !== 'masteradmin@safedsheri.com') {
        throw new BadRequestException('Only the Master Admin has permission to delete paid applications.');
      }
    }
    
    await this.prisma.registration.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'APPLICATION_SOFT_DELETED',
        targetEntity: 'Registration',
        targetId: id,
        payload: { registrationNumber: reg.registrationNumber },
      },
    });
    
    return { success: true, message: 'Application moved to trash' };
  }

  async restore(id: string, adminId: string) {
    const reg = await this.prisma.registration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Registration application not found');
    
    await this.prisma.registration.update({
      where: { id },
      data: { deletedAt: null },
    });
    
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'APPLICATION_RESTORED',
        targetEntity: 'Registration',
        targetId: id,
        payload: { registrationNumber: reg.registrationNumber },
      },
    });
    
    return { success: true, message: 'Application restored successfully' };
  }

  async hardDelete(id: string, adminId: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        payments: {
          where: { status: PaymentStatus.CONFIRMED },
        },
        credentials: true,
      },
    });
    if (!reg) throw new NotFoundException('Registration application not found');

    const isPaid =
      reg.status === RegistrationStatus.PAYMENT_CONFIRMED ||
      reg.status === RegistrationStatus.PASS_ISSUED ||
      (reg.payments && reg.payments.length > 0) ||
      (reg.credentials && reg.credentials.length > 0);

    if (isPaid) {
      const user = await this.prisma.user.findUnique({ where: { id: adminId } });
      if (!user || user.username !== 'masteradmin@safedsheri.com') {
        throw new BadRequestException('Only the Master Admin has permission to permanently delete paid applications.');
      }
    }
    
    await this.prisma.registration.delete({
      where: { id },
    });
    
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'APPLICATION_HARD_DELETED',
        targetEntity: 'Registration',
        targetId: id,
        payload: { registrationNumber: reg.registrationNumber },
      },
    });
    
    return { success: true, message: 'Application permanently deleted' };
  }

  async updatePaymentMethod(id: string, method: PaymentMethod, adminId: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        payments: {
          where: { status: PaymentStatus.CONFIRMED },
        },
      },
    });
    if (!reg) throw new NotFoundException('Registration not found');

    const confirmedPayment = reg.payments?.[0];

    if (confirmedPayment) {
      // If already paid, just change the payment method of the confirmed transaction
      const oldMethod = confirmedPayment.method;
      const updatedPayment = await this.prisma.payment.update({
        where: { id: confirmedPayment.id },
        data: { method },
      });
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'PAYMENT_METHOD_UPDATED',
          targetEntity: 'Registration',
          targetId: id,
          payload: {
            registrationNumber: reg.registrationNumber,
            oldMethod,
            newMethod: method,
          },
        },
      });
      return { success: true, message: 'Payment method updated successfully', data: updatedPayment };
    } else {
      // If not paid yet, trigger a manual settlement using confirmGatewayPayment from PaymentsService!
      let paymentLinkId = reg.paymentLinkId;
      if (!paymentLinkId) {
        paymentLinkId = `paylink_${crypto.randomBytes(16).toString('hex')}`;
        await this.prisma.registration.update({
          where: { id: reg.id },
          data: { paymentLinkId },
        });
      }

      // Call paymentsService.confirmGatewayPayment
      const res = await this.paymentsService.confirmGatewayPayment({
        paymentLinkId,
        providerReference: `ADMIN-MANUAL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        notes: `Confirmed by Admin (ID: ${adminId})`,
        method,
      });

      return {
        success: true,
        message: 'Payment confirmed and method set successfully',
        data: res.data,
      };
    }
  }

  async approveCashierRequest(id: string, adminId: string) {
    return this.paymentsService.approveCashierRequest(id, adminId);
  }

  async rejectCashierRequest(id: string, adminId: string, notes?: string) {
    return this.paymentsService.rejectCashierRequest(id, adminId, notes);
  }
}
