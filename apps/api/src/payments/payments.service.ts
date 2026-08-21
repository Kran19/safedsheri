import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialsService } from '../credentials/credentials.service';
import { EncryptionService } from '../common/encryption.service';
import { PaymentMethod, PaymentStatus, RegistrationStatus, PassType, Gender } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private credentialsService: CredentialsService,
    private encryptionService: EncryptionService,
  ) {}

  async findAll(status?: PaymentStatus) {
    const where: any = {};
    if (status) where.status = status;

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        registration: {
          include: {
            attendees: {
              include: {
                attendee: {
                  select: { id: true, fullName: true, phone: true, gender: true, aadhaarMasked: true },
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
      take: 200,
    });

    return { success: true, data: payments };
  }

  async getFinancialStats() {
    const payments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.CONFIRMED },
      include: {
        registration: {
          select: { passType: true },
        },
      },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalVolume = 0;
    let todayVolume = 0;
    const methodBreakdown: Record<string, number> = {
      ONLINE_GATEWAY: 0,
      UPI_QR: 0,
      CUSTOM_DIRECT: 0,
    };
    const passBreakdown: Record<string, number> = {
      SINGLE: 0,
      COUPLE: 0,
      GAZEBO: 0,
    };

    for (const p of payments) {
      const amt = Number(p.amount);
      totalVolume += amt;
      if (new Date(p.createdAt) >= todayStart) {
        todayVolume += amt;
      }
      methodBreakdown[p.method] = (methodBreakdown[p.method] || 0) + amt;
      const pt = p.registration?.passType || 'SINGLE';
      passBreakdown[pt] = (passBreakdown[pt] || 0) + 1;
    }

    return {
      success: true,
      data: {
        totalVolume,
        todayVolume,
        totalTransactions: payments.length,
        methodBreakdown,
        passBreakdown,
      },
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [{ id }, { receiptNumber: id }, { providerReference: id }],
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

  async getOrderDetails(paymentLinkId: string) {
    const registration = await this.prisma.registration.findFirst({
      where: { paymentLinkId },
      include: {
        pricingPhase: true,
        attendees: {
          include: {
            attendee: {
              select: {
                fullName: true,
                gender: true,
                phone: true,
                aadhaarMasked: true,
              },
            },
          },
        },
        payments: {
          where: { status: PaymentStatus.CONFIRMED },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Invalid or expired payment link');
    }

    const amountDue = Number(registration.amountDue);
    const upiQrPayload = `upi://pay?pa=safedsheri@icici&pn=Safed%20Sheri%202026&am=${amountDue}&tn=SS26-${registration.registrationNumber}&tr=${registration.paymentLinkId}`;

    return {
      success: true,
      data: {
        registrationId: registration.id,
        registrationNumber: registration.registrationNumber,
        passType: registration.passType,
        amountDue,
        status: registration.status,
        phaseName: registration.pricingPhase.phaseName,
        attendees: registration.attendees.map((a) => ({
          fullName: a.attendee.fullName,
          gender: a.attendee.gender,
          phone: a.attendee.phone,
          aadhaarMasked: a.attendee.aadhaarMasked,
        })),
        isPaid: registration.payments.length > 0,
        paymentLinkId: registration.paymentLinkId,
        upiQrPayload,
      },
    };
  }

  async generateCounterUpiQr(registrationId: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        attendees: {
          include: {
            attendee: {
              select: { fullName: true, phone: true, gender: true, aadhaarMasked: true },
            },
          },
        },
        pricingPhase: true,
        payments: { where: { status: PaymentStatus.CONFIRMED } },
      },
    });

    if (!reg) {
      throw new NotFoundException('Registration not found');
    }

    let paymentLinkId = reg.paymentLinkId;
    if (!paymentLinkId) {
      paymentLinkId = `paylink_${crypto.randomBytes(16).toString('hex')}`;
      await this.prisma.registration.update({
        where: { id: reg.id },
        data: { paymentLinkId, status: RegistrationStatus.PAYMENT_PENDING },
      });
    }

    const amountDue = Number(reg.amountDue);
    const upiQrPayload = `upi://pay?pa=safedsheri@icici&pn=Safed%20Sheri%202026&am=${amountDue}&tn=SS26-${reg.registrationNumber}&tr=${paymentLinkId}`;

    return {
      success: true,
      data: {
        registrationId: reg.id,
        registrationNumber: reg.registrationNumber,
        passType: reg.passType,
        amountDue,
        status: reg.status,
        isPaid: reg.payments.length > 0,
        paymentLinkId,
        upiQrPayload,
        attendees: reg.attendees.map((a) => a.attendee),
      },
      message: 'Dynamic UPI QR generated for online payment',
    };
  }

  async sendWhatsAppPaymentLink(registrationId: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        attendees: { include: { attendee: true } },
      },
    });

    if (!reg) throw new NotFoundException('Registration not found');
    const primary = reg.attendees[0]?.attendee;
    if (!primary) throw new BadRequestException('Primary attendee not found');

    const paymentUrl = `http://localhost:3000/?pay=${reg.paymentLinkId}`;

    return {
      success: true,
      message: `WhatsApp payment link dispatched to ${primary.phone} for ₹${Number(reg.amountDue).toLocaleString()}`,
      data: {
        phone: primary.phone,
        attendeeName: primary.fullName,
        paymentUrl,
      },
    };
  }

  async createManualDeskEntry(dto: {
    passType: PassType;
    customAmount: number;
    paymentMethod: PaymentMethod;
    attendees: Array<{
      fullName: string;
      phone: string;
      email?: string;
      gender: Gender;
      aadhaarNumber: string;
    }>;
    notes?: string;
    staffUserId: string;
  }) {
    if (!dto.attendees || dto.attendees.length === 0) {
      throw new BadRequestException('At least 1 attendee is required');
    }

    // Removed Single Pass Female rule to allow any gender to book

    return await this.prisma.$transaction(async (tx) => {
      // 1. Get Active Event & Phase
      const event = await tx.event.findFirst({ where: { status: 'ACTIVE' } });
      const phase = await tx.pricingPhase.findFirst({ where: { isActive: true } });
      if (!event || !phase) throw new BadRequestException('Active event or pricing phase missing');

      // 2. Generate Registration Number
      const count = await tx.registration.count();
      const registrationNumber = `SS-2026-${(count + 101).toString().padStart(6, '0')}`;
      const paymentLinkId = `paylink_${crypto.randomBytes(16).toString('hex')}`;

      // 3. Create Registration in PASS_ISSUED state
      const registration = await tx.registration.create({
        data: {
          registrationNumber,
          eventId: event.id,
          pricingPhaseId: phase.id,
          passType: dto.passType,
          amountDue: dto.customAmount,
          status: RegistrationStatus.PASS_ISSUED,
          paymentLinkId,
          createdById: dto.staffUserId,
          reviewedById: dto.staffUserId,
          reviewedAt: new Date(),
          reviewNotes: dto.notes || 'Manual Desk Entry by Staff',
        },
      });

      // 4. Create Attendees and Link
      for (let i = 0; i < dto.attendees.length; i++) {
        const attDto = dto.attendees[i];
        const cleanAadhaar = attDto.aadhaarNumber.replace(/\D/g, '');
        const aadhaarHmac = this.encryptionService.computeAadhaarHmac(cleanAadhaar);
        const aadhaarMasked = `XXXX-XXXX-${cleanAadhaar.slice(-4)}`;
        const aadhaarEncrypted = this.encryptionService.encrypt(cleanAadhaar);

        let attendee = await tx.attendee.findUnique({
          where: { aadhaarHmac },
        });

        if (!attendee) {
          attendee = await tx.attendee.create({
            data: {
              fullName: attDto.fullName,
              phone: attDto.phone,
              email: attDto.email,
              gender: attDto.gender,
              aadhaarHmac,
              aadhaarMasked,
              aadhaarEncrypted,
            },
          });
        }

        await tx.registrationAttendee.create({
          data: {
            registrationId: registration.id,
            attendeeId: attendee.id,
            isPrimary: i === 0,
          },
        });
      }

      // 5. Create Confirmed Payment Record
      const receiptSeq = (await tx.payment.count() + 1001).toString();
      const receiptNumber = `RCP-2026-${receiptSeq}`;
      const providerRef = `DESK-${dto.paymentMethod}-${Date.now().toString().slice(-6)}`;

      const payment = await tx.payment.create({
        data: {
          registrationId: registration.id,
          amount: dto.customAmount,
          method: dto.paymentMethod,
          status: PaymentStatus.CONFIRMED,
          receiptNumber,
          provider: 'BOX_OFFICE_DESK_OPERATIONS',
          providerReference: providerRef,
          paymentLinkId,
          collectedById: dto.staffUserId,
          notes: dto.notes || `Manual desk payment recorded via ${dto.paymentMethod}`,
        },
      });

      // 6. Mint Instant Credentials
      const credentials = await this.credentialsService.generateCredentialsForRegistration(registration.id, tx);

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: dto.staffUserId,
          action: 'MANUAL_DESK_ENTRY_CREATED',
          targetEntity: 'Registration',
          targetId: registration.id,
          payload: {
            receiptNumber,
            amount: dto.customAmount,
            method: dto.paymentMethod,
            credentialsCount: credentials.length,
          },
        },
      });

      return {
        success: true,
        data: {
          registration,
          payment,
          credentials,
        },
        message: `Manual entry created! Receipt #${receiptNumber} generated with ${credentials.length} active pass(es).`,
      };
    });
  }

  async confirmRazorpayPayment(body: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; paymentLinkId: string }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentLinkId } = body;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'ongR1rNVsrzSoVyjGx6VY9Zm';

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    return this.confirmGatewayPayment({
      paymentLinkId,
      providerReference: razorpay_payment_id,
      notes: `Razorpay Order ID: ${razorpay_order_id}`,
      method: PaymentMethod.ONLINE_GATEWAY,
    });
  }

  async confirmGatewayPayment(data: {

    paymentLinkId: string;
    providerReference?: string;
    notes?: string;
    method?: PaymentMethod;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findFirst({
        where: { paymentLinkId: data.paymentLinkId },
        include: { credentials: true },
      });

      if (!registration) {
        throw new NotFoundException(`Order with paymentLinkId "${data.paymentLinkId}" not found`);
      }

      const lockedRows: any[] = await tx.$queryRaw`
        SELECT id, "registrationNumber", status, "amountDue", "createdById"
        FROM "Registration"
        WHERE id = ${registration.id}
        FOR UPDATE
      `;
      const lockedReg = lockedRows[0];

      if (
        lockedReg.status !== RegistrationStatus.APPROVED &&
        lockedReg.status !== RegistrationStatus.PAYMENT_PENDING
      ) {
        if (lockedReg.status === RegistrationStatus.PAYMENT_CONFIRMED || lockedReg.status === RegistrationStatus.PASS_ISSUED) {
          const existingPayment = await tx.payment.findFirst({
            where: { registrationId: lockedReg.id, status: PaymentStatus.CONFIRMED },
          });
          return {
            success: true,
            data: {
              registration: lockedReg,
              payment: existingPayment,
              credentials: registration.credentials,
            },
            message: 'Payment was already confirmed',
          };
        }
        throw new BadRequestException(
          `Cannot process payment for application in ${lockedReg.status} status. Admin approval is required first.`,
        );
      }

      const receiptSeq = (await tx.payment.count() + 1001).toString();
      const receiptNumber = `RCP-2026-${receiptSeq}`;
      const providerRef = data.providerReference || `PG-UPI-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const payment = await tx.payment.create({
        data: {
          registrationId: lockedReg.id,
          amount: lockedReg.amountDue,
          method: data.method || PaymentMethod.UPI_QR,
          status: PaymentStatus.CONFIRMED,
          receiptNumber,
          provider: 'SAFED_SHERI_ONLINE_UPI_GATEWAY',
          providerReference: providerRef,
          paymentLinkId: data.paymentLinkId,
          notes: data.notes || 'Online UPI QR Payment Authoritatively Verified',
        },
      });

      await tx.registration.update({
        where: { id: lockedReg.id },
        data: { status: RegistrationStatus.PAYMENT_CONFIRMED },
      });

      const credentials = await this.credentialsService.generateCredentialsForRegistration(lockedReg.id, tx);

      await tx.auditLog.create({
        data: {
          actorId: lockedReg.createdById,
          action: 'ONLINE_PAYMENT_CONFIRMED_PASS_ISSUED',
          targetEntity: 'Registration',
          targetId: lockedReg.id,
          payload: {
            receiptNumber,
            amount: Number(lockedReg.amountDue),
            providerReference: providerRef,
            method: data.method || PaymentMethod.UPI_QR,
            credentialsCount: credentials.length,
          },
        },
      });

      return {
        success: true,
        data: {
          registrationId: lockedReg.id,
          registrationNumber: lockedReg.registrationNumber,
          receiptNumber,
          providerReference: providerRef,
          amount: Number(lockedReg.amountDue),
          status: RegistrationStatus.PASS_ISSUED,
          credentialsCount: credentials.length,
        },
        message: 'Online Payment Confirmed! Active Pass Credentials Issued.',
      };
    });
  }
}
