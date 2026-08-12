import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus, RegistrationStatus, CredentialStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(locationId?: string, collectedById?: string) {
    const where: any = {};
    if (locationId) where.paymentLocationId = locationId;
    if (collectedById) where.collectedById = collectedById;

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        registration: {
          include: {
            attendees: {
              include: {
                attendee: {
                  select: { id: true, fullName: true, phone: true, aadhaarMasked: true },
                },
              },
            },
          },
        },
        paymentLocation: {
          select: { id: true, name: true },
        },
        collectedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { success: true, data: payments };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [{ id }, { receiptNumber: id }],
      },
      include: {
        registration: {
          include: {
            attendees: { include: { attendee: true } },
            credentials: true,
          },
        },
        paymentLocation: true,
        collectedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }
    return { success: true, data: payment };
  }

  async recordPayment(data: {
    registrationId: string;
    paymentLocationId: string;
    collectedById: string;
    amount?: number;
    notes?: string;
  }) {
    // Execute Option A: Atomic Prisma Transaction with SELECT FOR UPDATE Row Lock for Idempotency
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Lock Target Registration Row in PostgreSQL
      const lockedRegs: any[] = await tx.$queryRaw`
        SELECT id, "registrationNumber", status, "amountDue" FROM "Registration" WHERE id = ${data.registrationId} FOR UPDATE
      `;

      if (!lockedRegs || lockedRegs.length === 0) {
        throw new NotFoundException('Registration not found');
      }

      const lockedReg = lockedRegs[0];

      // IDEMPOTENCY CHECK: If payment is ALREADY CONFIRMED, return existing payment & credentials without duplicating!
      if (lockedReg.status === RegistrationStatus.PAYMENT_CONFIRMED) {
        const existingPayment = await tx.payment.findFirst({
          where: { registrationId: data.registrationId },
        });
        const existingReg = await tx.registration.findUnique({
          where: { id: data.registrationId },
          include: { attendees: { include: { attendee: true } } },
        });
        const existingCreds = await tx.credential.findMany({
          where: { registrationId: data.registrationId },
        });

        return {
          payment: existingPayment,
          registration: existingReg,
          credentials: existingCreds,
          isAlreadyConfirmed: true,
        };
      }

      if (lockedReg.status === RegistrationStatus.CANCELLED) {
        throw new BadRequestException('Cannot record payment for a cancelled registration');
      }

      // Fetch registration attendees & details
      const registration = await tx.registration.findUnique({
        where: { id: data.registrationId },
        include: {
          attendees: { include: { attendee: true } },
          credentials: true,
        },
      });

      // Authoritative Backend Price (Client-supplied amount is NEVER trusted)
      const authoritativeAmount = Number(registration.amountDue);

      // 2. Generate Unique Receipt Number (RCP-2026-XXXXXX)
      const pCount = await tx.payment.count();
      const receiptSeq = (pCount + 101).toString().padStart(6, '0');
      const receiptNumber = `RCP-2026-${receiptSeq}`;

      // 3. Create Cash Payment Record
      const payment = await tx.payment.create({
        data: {
          registrationId: data.registrationId,
          paymentLocationId: data.paymentLocationId,
          collectedById: data.collectedById,
          amount: authoritativeAmount,
          method: PaymentMethod.CASH,
          status: PaymentStatus.CONFIRMED,
          receiptNumber,
          notes: data.notes,
        },
      });

      // 4. Transactionally Update Registration Status to PAYMENT_CONFIRMED
      const updatedRegistration = await tx.registration.update({
        where: { id: data.registrationId },
        data: { status: RegistrationStatus.PAYMENT_CONFIRMED },
      });

      // 5. Generate 1 Unique Active Credential per Individual Attendee (Single = 1, Couple = 2)
      const issuedCredentials = [];
      const cCount = await tx.credential.count();

      for (let i = 0; i < registration.attendees.length; i++) {
        const regAtt = registration.attendees[i];
        const randomHex = crypto.randomBytes(16).toString('hex');
        const secureToken = `ss_qr_${randomHex}`;
        const credSeq = (cCount + i + 101).toString().padStart(6, '0');
        const suffix = registration.attendees.length > 1 ? `-${String.fromCharCode(65 + i)}` : '';
        const credentialNumber = `PASS-2026-${credSeq}${suffix}`;

        const cred = await tx.credential.create({
          data: {
            credentialNumber,
            registrationId: data.registrationId,
            attendeeId: regAtt.attendeeId,
            secureToken,
            status: CredentialStatus.ACTIVE,
            issuedAt: new Date(),
          },
        });
        issuedCredentials.push(cred);
      }

      // 6. Write Immutable Audit Log Entry
      await tx.auditLog.create({
        data: {
          actorId: data.collectedById,
          action: 'CASH_PAYMENT_CONFIRMED_AND_PASSES_ISSUED',
          targetEntity: 'Payment',
          targetId: payment.id,
          payload: {
            receiptNumber,
            amount: authoritativeAmount,
            method: PaymentMethod.CASH,
            issuedCredentialsCount: issuedCredentials.length,
          },
        },
      });

      return {
        payment,
        registration: updatedRegistration,
        credentials: issuedCredentials,
        isAlreadyConfirmed: false,
      };
    });

    return {
      success: true,
      data: result,
      message: result.isAlreadyConfirmed
        ? `Payment was already confirmed previously for this registration.`
        : `Cash payment confirmed! Issued ${result.credentials.length} active pass credential(s). Receipt: ${result.payment.receiptNumber}`,
    };
  }
}
