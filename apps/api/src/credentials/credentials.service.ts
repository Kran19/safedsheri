import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { CredentialStatus, RegistrationStatus, PassType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class CredentialsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async findOne(id: string) {
    const credential = await this.prisma.credential.findFirst({
      where: {
        OR: [{ id }, { secureToken: id }, { credentialNumber: id }, { passCode: id }],
      },
      include: {
        attendee: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            gender: true,
            aadhaarMasked: true,
          },
        },
        registration: {
          select: {
            id: true,
            registrationNumber: true,
            passType: true,
            status: true,
          },
        },
      },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }
    return { success: true, data: credential };
  }

  async generateCredentialsForRegistration(registrationId: string, customTx?: any) {
    const db = customTx || this.prisma;

    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: {
        attendees: {
          include: { attendee: true },
        },
        credentials: true,
      },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${registrationId} not found`);
    }

    if (registration.credentials && registration.credentials.length > 0) {
      return registration.credentials;
    }

    const generatedCredentials = [];
    const prefix = registration.passType === PassType.SINGLE
      ? 'SS26-SINGLE'
      : registration.passType === PassType.COUPLE
      ? 'SS26-COUPLE'
      : 'SS26-GAZEBO';

    // Filter attendees who are NOT rejected
    const eligibleAttendees = registration.attendees.filter(
      (ra) => ra.status !== RegistrationStatus.REJECTED
    );

    for (let i = 0; i < eligibleAttendees.length; i++) {
      const att = eligibleAttendees[i].attendee;
      const passRandom = crypto.randomBytes(2).toString('hex').toUpperCase();
      const passCode = `${prefix}-${passRandom}`;
      const credSeq = (Math.floor(100000 + Math.random() * 900000)).toString();
      const credentialNumber = `PASS-2026-${credSeq}`;
      const secureToken = `ss_qr_${crypto.randomBytes(32).toString('hex')}`;

      const credential = await db.credential.create({
        data: {
          credentialNumber,
          passCode,
          registrationId: registration.id,
          attendeeId: att.id,
          secureToken,
          status: CredentialStatus.ACTIVE,
        },
      });

      generatedCredentials.push(credential);
    }

    await db.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.PASS_ISSUED },
    });

    return generatedCredentials;
  }

  async findMyPass(query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Valid phone number or Aadhaar number is required to access My Pass wallet');
    }

    const cleanDigits = query.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number or 12-digit Aadhaar number');
    }

    const attendeeWhereOr: any[] = [];

    // Search by 12-digit Aadhaar number (HMAC / Masked)
    if (cleanDigits.length === 12) {
      const aadhaarHmac = this.encryptionService.computeAadhaarHmac(cleanDigits);
      attendeeWhereOr.push({ aadhaarHmac });
      attendeeWhereOr.push({ aadhaarMasked: { contains: cleanDigits.slice(-4) } });
    }

    // Search by 10-digit mobile number
    const last10 = cleanDigits.slice(-10);
    attendeeWhereOr.push({ phone: { contains: last10 } });

    const initialAttendees = await this.prisma.attendee.findMany({
      where: {
        OR: attendeeWhereOr,
      },
      include: { registrations: true },
    });

    if (!initialAttendees || initialAttendees.length === 0) {
      return {
        success: true,
        data: [],
        message: `No booking records found for "${query}".`,
      };
    }

    const registrationIds = Array.from(
      new Set(initialAttendees.flatMap((att) => att.registrations.map((r) => r.registrationId)))
    );

    const attendees = await this.prisma.attendee.findMany({
      where: {
        registrations: {
          some: { registrationId: { in: registrationIds } }
        }
      },
      include: {
        registrations: {
          where: { registrationId: { in: registrationIds } },
          include: {
            registration: {
              include: {
                pricingPhase: true,
                credentials: true,
                payments: true,
              },
            },
          },
          orderBy: { registration: { createdAt: 'desc' } },
        },
        credentials: {
          where: { registrationId: { in: registrationIds } },
          include: {
            registration: true,
          },
          orderBy: { issuedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const passes = [];

    for (const att of attendees) {
      const regAttList = att.registrations || [];

      // Check if this attendee has any active or used credential
      const activeCred = att.credentials.find(
        (c) => c.status === CredentialStatus.ACTIVE || c.status === CredentialStatus.USED
      );

      // Check if attendee is part of an active/pending registration where this attendee is NOT rejected
      const activeRegLink = regAttList.find((ra) => {
        const r = ra.registration;
        const isRegActive =
          r.status === RegistrationStatus.PASS_ISSUED ||
          r.status === RegistrationStatus.PAYMENT_PENDING ||
          r.status === RegistrationStatus.APPROVED ||
          r.status === RegistrationStatus.SUBMITTED ||
          r.status === RegistrationStatus.UNDER_REVIEW;
        return isRegActive && ra.status !== RegistrationStatus.REJECTED;
      });

      if (activeCred || activeRegLink) {
        // Attendee has an ACTIVE or APPROVED/PENDING pass!
        // Push ONLY the active pass / current registration.
        // DO NOT show old historical rejected cards for this attendee!
        const targetReg = activeCred?.registration || activeRegLink?.registration;
        if (targetReg) {
          passes.push({
            attendeeId: att.id,
            attendeeName: att.fullName,
            phone: att.phone,
            gender: att.gender,
            aadhaarMasked: att.aadhaarMasked,
            registrationId: targetReg.id,
            registrationNumber: targetReg.registrationNumber,
            registrationStatus: targetReg.status,
            attendeeStatus: activeRegLink?.status || (activeCred ? 'PASS_ISSUED' : targetReg.status),
            passType: targetReg.passType,
            paymentLinkId: targetReg.paymentLinkId,
            amountDue: Number(targetReg.amountDue),
            reviewNotes: activeRegLink?.reviewNotes || targetReg.reviewNotes,
            submittedAt: targetReg.createdAt,
            hasActivePass: Boolean(activeCred && activeCred.status === CredentialStatus.ACTIVE),
            hasUsedPass: Boolean(activeCred && activeCred.status === CredentialStatus.USED),
            credential: activeCred
              ? {
                  credentialNumber: activeCred.credentialNumber,
                  passCode: activeCred.passCode,
                  secureToken: activeCred.secureToken,
                  status: activeCred.status,
                  issuedAt: activeCred.issuedAt,
                  usedAt: activeCred.usedAt,
                }
              : null,
            isPaymentPending:
              targetReg.status === RegistrationStatus.APPROVED ||
              targetReg.status === RegistrationStatus.PAYMENT_PENDING,
            isUnderReview:
              targetReg.status === RegistrationStatus.SUBMITTED ||
              targetReg.status === RegistrationStatus.UNDER_REVIEW,
            isRejected: false,
            isCancelled: targetReg.status === RegistrationStatus.CANCELLED,
            isPrimary: activeRegLink?.isPrimary || false,
          });
        }
      } else {
        // Attendee has NO active/pending pass, and their latest decision is REJECTED.
        // Push ONLY their latest rejected record so they can read the specific note and click "Apply Again".
        const latestRegAtt = regAttList[0];
        if (latestRegAtt) {
          const reg = latestRegAtt.registration;
          passes.push({
            attendeeId: att.id,
            attendeeName: att.fullName,
            phone: att.phone,
            gender: att.gender,
            aadhaarMasked: att.aadhaarMasked,
            registrationId: reg.id,
            registrationNumber: reg.registrationNumber,
            registrationStatus: 'REJECTED',
            attendeeStatus: 'REJECTED',
            passType: reg.passType,
            paymentLinkId: null,
            amountDue: Number(reg.amountDue),
            reviewNotes:
              latestRegAtt.reviewNotes ||
              reg.reviewNotes ||
              'Aadhaar document verification failed. Please upload a clear document and apply again.',
            submittedAt: reg.createdAt,
            hasActivePass: false,
            hasUsedPass: false,
            credential: null,
            isPaymentPending: false,
            isUnderReview: false,
            isRejected: true,
            isCancelled: false,
          });
        }
      }
    }

    // Status Hierarchy Sorting:
    // 1. PASS_ISSUED
    // 2. PAYMENT_PENDING
    // 3. UNDER_REVIEW
    // 4. REJECTED / CANCELLED
    // Secondary Sort: Latest submission date first (createdAt descending)
    const statusWeight: Record<string, number> = {
      PASS_ISSUED: 1,
      PAYMENT_PENDING: 2,
      APPROVED: 2,
      UNDER_REVIEW: 3,
      SUBMITTED: 3,
      REJECTED: 4,
      CANCELLED: 5,
    };

    passes.sort((a, b) => {
      const weightA = statusWeight[a.registrationStatus] || 99;
      const weightB = statusWeight[b.registrationStatus] || 99;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
    });

    return {
      success: true,
      data: passes,
    };
  }
}
