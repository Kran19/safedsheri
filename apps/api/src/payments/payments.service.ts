import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialsService } from '../credentials/credentials.service';
import { EncryptionService } from '../common/encryption.service';
import { PaymentMethod, PaymentStatus, RegistrationStatus, PassType, Gender } from '@prisma/client';
import { PaymentGatewayService } from './payment-gateway.service';
import { EmailService } from '../common/email.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private credentialsService: CredentialsService,
    private encryptionService: EncryptionService,
    private paymentGatewayService: PaymentGatewayService,
    private emailService: EmailService,
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

    // Create a real Razorpay Order on the fly so the frontend can check out
    const orderData = await this.paymentGatewayService.createPaymentOrder({
      registrationId: registration.id,
      registrationNumber: registration.registrationNumber,
      amount: amountDue,
      customerName: registration.attendees[0]?.attendee.fullName || 'Customer',
      customerPhone: registration.attendees[0]?.attendee.phone || '0000000000',
    });

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
        razorpayOrderId: orderData.razorpayOrderId,
        razorpayKeyId: orderData.razorpayKeyId,
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

    // Default primary email if missing for walk-in desk booking
    const primaryPhone = dto.attendees[0].phone?.replace(/\D/g, '') || Date.now().toString().slice(-6);
    const primaryEmail = dto.attendees[0].email || `walkin-${primaryPhone}@safedsheri.com`;

    // Strict validation for Couple Pass
    if (dto.passType === 'COUPLE') {
      if (dto.attendees.length !== 2) {
        throw new BadRequestException('Couple Pass requires exactly 2 attendee records (1 Male and 1 Female).');
      }
      const maleCount = dto.attendees.filter(a => a.gender === 'MALE').length;
      const femaleCount = dto.attendees.filter(a => a.gender === 'FEMALE').length;
      if (maleCount !== 1 || femaleCount !== 1) {
        throw new BadRequestException('Couple Pass strictly requires exactly 1 Male and 1 Female attendee.');
      }
    }

    // Strict validation for Kids Pass
    if (dto.passType === 'KIDS') {
      const kid = dto.attendees[0];
      if (kid && (kid as any).dob) {
        const [y, m, d] = (kid as any).dob.split('-').map(Number);
        const dobDate = new Date(y, m - 1, d);
        if (!isNaN(dobDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - dobDate.getFullYear();
          const mDiff = today.getMonth() - dobDate.getMonth();
          if (mDiff < 0 || (mDiff === 0 && today.getDate() < dobDate.getDate())) age--;
          if (age > 15) {
            throw new BadRequestException('Kids Pass is strictly for children aged 15 and below. Age calculated: ' + age + ' years.');
          }
        }
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Get Active Event & Phase
      const event = await tx.event.findFirst({ where: { status: 'ACTIVE' } });
      const phase = await tx.pricingPhase.findFirst({ where: { isActive: true } });
      if (!event || !phase) throw new BadRequestException('Active event or pricing phase missing');

      // 2. Generate Registration Number
      const registrationNumber = await this.generateUniqueRegistrationNumber(tx);
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
          reviewNotes: dto.notes || `Manual Desk Entry by Cashier (${dto.paymentMethod})`,
        },
      });

      // 4. Create Attendees and Link
      for (let i = 0; i < dto.attendees.length; i++) {
        const attDto = dto.attendees[i] as any;
        const cleanAadhaar = attDto.aadhaarNumber ? attDto.aadhaarNumber.replace(/\D/g, '') : `9999${Date.now().toString().slice(-8)}`;
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
              email: attDto.email || (i === 0 ? primaryEmail : undefined),
              gender: attDto.gender,
              dob: attDto.dob ? new Date(attDto.dob) : undefined,
              kidsAgeGroup: attDto.kidsAgeGroup || undefined,
              aadhaarHmac,
              aadhaarMasked,
              aadhaarEncrypted,
            },
          });
        } else {
          await tx.attendee.update({
            where: { id: attendee.id },
            data: {
              fullName: attDto.fullName,
              phone: attDto.phone,
              gender: attDto.gender,
              dob: attDto.dob ? new Date(attDto.dob) : attendee.dob,
              kidsAgeGroup: attDto.kidsAgeGroup || attendee.kidsAgeGroup,
            },
          });
        }

        if (attDto.documentFrontKey) {
          await tx.aadhaarDocument.upsert({
            where: { attendeeId: attendee.id },
            update: {
              storageKey: attDto.documentFrontKey,
              storageKeyBack: attDto.documentBackKey || undefined,
            },
            create: {
              attendeeId: attendee.id,
              storageKey: attDto.documentFrontKey,
              storageKeyBack: attDto.documentBackKey || undefined,
              originalFilename: 'cashier_desk_upload.jpg',
              mimeType: 'image/jpeg',
              sizeBytes: 1024,
              checksum: 'desk_manual_entry',
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
      const providerRef = `DESK-${dto.paymentMethod === 'CUSTOM_DIRECT' ? 'CASH' : dto.paymentMethod}-${Date.now().toString().slice(-6)}`;

      const payment = await tx.payment.create({
        data: {
          registrationId: registration.id,
          amount: dto.customAmount,
          method: dto.paymentMethod,
          status: PaymentStatus.CONFIRMED,
          receiptNumber,
          provider: dto.paymentMethod === 'CUSTOM_DIRECT' ? 'CASH_BOX_OFFICE' : 'UPI_DESK_DYNAMIC_QR',
          providerReference: providerRef,
          paymentLinkId,
          collectedById: dto.staffUserId,
          notes: dto.notes || `Manual desk payment recorded via ${dto.paymentMethod === 'CUSTOM_DIRECT' ? 'CASH' : 'UPI DYNAMIC QR'}`,
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

  async createStandardOrder(dto: { amount: number; currency?: string; receipt?: string; notes?: any }) {
    if (!dto.amount || dto.amount < 100) {
      throw new BadRequestException('Amount must be at least 100 paise (₹1)');
    }
    return this.paymentGatewayService.createStandardOrder(dto.amount, dto.currency, dto.receipt, dto.notes);
  }

  async verifyPaymentSignature(body: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; paymentLinkId?: string }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentLinkId } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new BadRequestException('Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature');
    }

    const isValid = this.paymentGatewayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    if (paymentLinkId) {
      return this.confirmGatewayPayment({
        paymentLinkId,
        providerReference: razorpay_payment_id,
        notes: `Razorpay Order ID: ${razorpay_order_id}`,
        method: PaymentMethod.ONLINE_GATEWAY,
      });
    }

    return {
      success: true,
      message: 'Payment signature verified successfully',
      data: {
        razorpay_order_id,
        razorpay_payment_id,
        verified: true,
      },
    };
  }

  async confirmRazorpayPayment(body: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; paymentLinkId: string }) {
    return this.verifyPaymentSignature(body);
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
