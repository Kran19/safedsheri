import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialsService } from '../credentials/credentials.service';
import { EncryptionService } from '../common/encryption.service';
import { PaymentMethod, PaymentStatus, RegistrationStatus, PassType, Gender, CredentialStatus } from '@prisma/client';
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

  async getFinanceFundamentalStats() {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'CONFIRMED' },
      select: { method: true, amount: true, providerReference: true },
    });

    let totalCash = 0;
    let totalRazorpayActual = 0;
    let totalAdminManualQr = 0;

    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      if (p.method === 'CASH') {
        totalCash += amt;
      } else if (p.method === 'ONLINE_GATEWAY') {
        if (p.providerReference && p.providerReference.startsWith('ADMIN-MANUAL')) {
          totalAdminManualQr += amt;
        } else {
          totalRazorpayActual += amt;
        }
      }
    }

    const recentTransactions = await this.prisma.payment.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        registration: {
          include: {
            attendees: {
              include: { attendee: true },
            },
          },
        },
        collectedBy: {
          select: { fullName: true, role: true },
        },
      },
    });

    return {
      success: true,
      data: {
        totalCash,
        totalRazorpayActual,
        totalAdminManualQr,
        recentTransactions,
      },
    };
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

    let customDirectVolume = 0;
    let customDirectCount = 0;
    let upiQrVolume = 0;
    let upiQrCount = 0;
    let onlineGatewayVolume = 0;
    let onlineGatewayCount = 0;

    const methodBreakdown: Record<string, number> = {
      ONLINE_GATEWAY: 0,
      UPI_QR: 0,
      CUSTOM_DIRECT: 0,
    };
    const passBreakdown: Record<string, number> = {
      SINGLE: 0,
      COUPLE: 0,
      KIDS: 0,
      GAZEBO: 0,
    };

    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      totalVolume += amt;
      if (new Date(p.createdAt) >= todayStart) {
        todayVolume += amt;
      }
      methodBreakdown[p.method] = (methodBreakdown[p.method] || 0) + amt;

      if (p.method === 'CUSTOM_DIRECT') {
        customDirectVolume += amt;
        customDirectCount++;
      } else if (p.method === 'UPI_QR') {
        upiQrVolume += amt;
        upiQrCount++;
      } else {
        onlineGatewayVolume += amt;
        onlineGatewayCount++;
      }

      const pt = p.registration?.passType || 'SINGLE';
      passBreakdown[pt] = (passBreakdown[pt] || 0) + 1;
    }

    return {
      success: true,
      data: {
        totalCollection: totalVolume,
        totalVolume,
        todayVolume,
        totalTransactions: payments.length,
        breakdown: {
          customDirectVolume,
          customDirectCount,
          upiQrVolume,
          upiQrCount,
          onlineGatewayVolume,
          onlineGatewayCount,
        },
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

    // Create real Razorpay order for this registration
    const orderData = await this.paymentGatewayService.createPaymentOrder({
      registrationId: reg.id,
      registrationNumber: reg.registrationNumber,
      amount: amountDue,
      customerName: reg.attendees[0]?.attendee.fullName || 'Customer',
      customerPhone: reg.attendees[0]?.attendee.phone || '0000000000',
    });

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
        razorpayOrderId: orderData.razorpayOrderId,
        razorpayKeyId: orderData.razorpayKeyId,
        attendees: reg.attendees.map((a) => a.attendee),
      },
      message: 'Real Razorpay order created for online payment',
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

    const paymentUrl = `https://safedsheri.com/?pay=${reg.paymentLinkId}`;

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
    staffUserId: string;
    attendees: Array<{
      fullName: string;
      phone: string;
      email?: string;
      gender: Gender;
      aadhaarNumber?: string;
      dob?: string;
      kidsAgeGroup?: string;
      documentFrontKey?: string;
      documentBackKey?: string;
    }>;
    notes?: string;
  }) {
    if (!dto.attendees || dto.attendees.length === 0) {
      throw new BadRequestException('At least one attendee is required');
    }

    const primaryEmail = dto.attendees[0]?.email || `desk_${Date.now()}@safedsheri.com`;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Get Active Event & Phase & Staff User
      const event = await tx.event.findFirst({ where: { status: 'ACTIVE' } });
      const phase = await tx.pricingPhase.findFirst({ where: { isActive: true } });
      const staffUser = await tx.user.findUnique({ where: { id: dto.staffUserId } });
      if (!event || !phase) throw new BadRequestException('Active event or pricing phase missing');
      if (!staffUser) throw new BadRequestException('Staff user not found');

      const isSuperAdmin = staffUser.role === 'SUPER_ADMIN';

      // 2. Generate Registration Number
      const registrationNumber = await this.generateUniqueRegistrationNumber(tx);
      const paymentLinkId = `paylink_${crypto.randomBytes(16).toString('hex')}`;

      // 3. Create Registration
      const registration = await tx.registration.create({
        data: {
          registrationNumber,
          eventId: event.id,
          pricingPhaseId: phase.id,
          passType: dto.passType,
          amountDue: dto.customAmount,
          status: isSuperAdmin ? (dto.paymentMethod === PaymentMethod.UPI_QR ? RegistrationStatus.PAYMENT_PENDING : RegistrationStatus.PASS_ISSUED) : RegistrationStatus.CASHIER_PENDING,
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

      // 5. IF UPI_QR AND SUPER_ADMIN: Create Real Razorpay Order for live customer payment directly to merchant bank account
      if (dto.paymentMethod === PaymentMethod.UPI_QR && isSuperAdmin) {
        const orderData = await this.paymentGatewayService.createPaymentOrder({
          registrationId: registration.id,
          registrationNumber: registration.registrationNumber,
          amount: dto.customAmount,
          customerName: dto.attendees[0]?.fullName || 'Cashier Desk Guest',
          customerPhone: dto.attendees[0]?.phone || '0000000000',
        });

        await tx.auditLog.create({
          data: {
            actorId: dto.staffUserId,
            action: 'MANUAL_DESK_ENTRY_RAZORPAY_QR_INITIATED',
            targetEntity: 'Registration',
            targetId: registration.id,
            payload: {
              amount: dto.customAmount,
              razorpayOrderId: orderData.razorpayOrderId,
            },
          },
        });

        return {
          success: true,
          data: {
            isRazorpayOrder: true,
            registration: {
              ...registration,
              status: isSuperAdmin ? RegistrationStatus.PAYMENT_PENDING : RegistrationStatus.CASHIER_PENDING,
            },
            amountDue: dto.customAmount,
            paymentLinkId,
            razorpayOrderId: orderData.razorpayOrderId,
            razorpayKeyId: orderData.razorpayKeyId,
            primaryAttendee: dto.attendees[0],
          },
          message: `Real Razorpay Order #${orderData.razorpayOrderId} created! Customer can scan QR or pay via UPI.`,
        };
      }

      // 6. IF CASH (CUSTOM_DIRECT) or non-admin UPI_QR: Create PENDING/CONFIRMED Payment Record
      let receiptSeqNum = await tx.payment.count() + 1001;
      const latestReceipt = await tx.payment.findFirst({
        where: { receiptNumber: { startsWith: 'RCP-2026-' } },
        orderBy: { createdAt: 'desc' },
      });
      if (latestReceipt && latestReceipt.receiptNumber) {
        const match = latestReceipt.receiptNumber.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num >= receiptSeqNum) receiptSeqNum = num + 1;
        }
      }
      const receiptNumber = `RCP-2026-${receiptSeqNum}`;
      
      const isUpi = dto.paymentMethod === PaymentMethod.UPI_QR;
      const providerRef = isUpi 
        ? `DESK-UPI-PENDING-${Date.now().toString().slice(-6)}`
        : `DESK-CASH-${Date.now().toString().slice(-6)}`;

      const payment = await tx.payment.create({
        data: {
          registrationId: registration.id,
          amount: dto.customAmount,
          method: dto.paymentMethod,
          status: isSuperAdmin ? PaymentStatus.CONFIRMED : PaymentStatus.PENDING,
          receiptNumber,
          provider: isUpi ? 'RAZORPAY_UPI' : 'CASH_BOX_OFFICE',
          providerReference: providerRef,
          paymentLinkId,
          collectedById: dto.staffUserId,
          notes: dto.notes || (isUpi ? 'UPI QR payment requested' : 'Cash payment collected at box office counter'),
        },
      });

      let fullCredentials: any[] = [];
      // 7. Mint Instant Credentials
      if (isSuperAdmin) {
        await this.credentialsService.generateCredentialsForRegistration(registration.id, tx);
        fullCredentials = await tx.credential.findMany({
          where: { registrationId: registration.id },
          include: {
            attendee: true,
            registration: true,
          },
          orderBy: { createdAt: 'asc' },
        });
      }

      // 8. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: dto.staffUserId,
          action: isSuperAdmin ? 'MANUAL_DESK_ENTRY_CREATED' : 'MANUAL_DESK_ENTRY_REQUESTED',
          targetEntity: 'Registration',
          targetId: registration.id,
          payload: {
            receiptNumber,
            amount: dto.customAmount,
            method: dto.paymentMethod,
            credentialsCount: fullCredentials.length,
            requiresAdminApproval: !isSuperAdmin,
          },
        },
      });

      return {
        success: true,
        data: {
          registration,
          payment,
          credentials: fullCredentials,
        },
        message: isSuperAdmin 
          ? `Manual entry created! Receipt #${receiptNumber} generated with ${fullCredentials.length} active pass(es).`
          : `Booking request submitted! Waiting for admin approval before pass is issued.`,
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

      let receiptSeqNum = await tx.payment.count() + 1001;
      const latestReceipt = await tx.payment.findFirst({
        where: { receiptNumber: { startsWith: 'RCP-2026-' } },
        orderBy: { createdAt: 'desc' },
      });
      if (latestReceipt && latestReceipt.receiptNumber) {
        const match = latestReceipt.receiptNumber.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num >= receiptSeqNum) receiptSeqNum = num + 1;
        }
      }
      const receiptNumber = `RCP-2026-${receiptSeqNum}`;
      const providerRef = data.providerReference || `PG-UPI-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Check if there is an existing pending payment (e.g. from cashier request) to update
      const existingPendingPayment = await tx.payment.findFirst({
        where: { registrationId: lockedReg.id, status: PaymentStatus.PENDING },
      });

      let payment;
      if (existingPendingPayment) {
        payment = await tx.payment.update({
          where: { id: existingPendingPayment.id },
          data: {
            status: PaymentStatus.CONFIRMED,
            provider: 'SAFED_SHERI_ONLINE_UPI_GATEWAY',
            providerReference: providerRef,
            notes: data.notes || 'Online UPI QR Payment Authoritatively Verified',
            ...(data.method ? { method: data.method } : {}),
          },
        });
      } else {
        payment = await tx.payment.create({
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
      }

      await tx.registration.update({
        where: { id: lockedReg.id },
        data: { status: RegistrationStatus.PAYMENT_CONFIRMED },
      });

      await this.credentialsService.generateCredentialsForRegistration(lockedReg.id, tx);
      const fullCredentials = await tx.credential.findMany({
        where: { registrationId: lockedReg.id },
        include: {
          attendee: true,
          registration: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      await tx.auditLog.create({
        data: {
          actorId: lockedReg.createdById || 'SYSTEM',
          action: 'ONLINE_PAYMENT_CONFIRMED_PASS_ISSUED',
          targetEntity: 'Registration',
          targetId: lockedReg.id,
          payload: {
            receiptNumber,
            amount: Number(lockedReg.amountDue),
            providerReference: providerRef,
            method: data.method || PaymentMethod.UPI_QR,
            credentialsCount: fullCredentials.length,
          },
        },
      });

      return {
        success: true,
        data: {
          registration: lockedReg,
          payment,
          credentials: fullCredentials,
        },
        message: 'Online Payment Confirmed! Active Pass Credentials Issued.',
      };
    });
  }

  async approveCashierRequest(registrationId: string, adminId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const reg = await tx.registration.findUnique({
        where: { id: registrationId },
        include: { payments: true },
      });
      if (!reg) throw new NotFoundException('Registration not found');
      if (reg.status !== RegistrationStatus.CASHIER_PENDING) {
        throw new BadRequestException('Registration is not pending cashier approval');
      }

      const pendingPayment = reg.payments.find(p => p.status === PaymentStatus.PENDING);
      
      const isUpi = pendingPayment && pendingPayment.method === PaymentMethod.UPI_QR;

      if (isUpi) {
        // For UPI QR request: Set status to PAYMENT_PENDING so customer can scan and pay
        await tx.registration.update({
          where: { id: registrationId },
          data: { status: RegistrationStatus.PAYMENT_PENDING },
        });

        await tx.auditLog.create({
          data: {
            actorId: adminId,
            action: 'CASHIER_REQUEST_APPROVED_FOR_UPI',
            targetEntity: 'Registration',
            targetId: registrationId,
            payload: { notes: 'Approved for UPI QR payment. Awaiting customer scan.' },
          },
        });

        return { success: true, message: 'UPI request approved. Registration is now pending payment.' };
      } else {
        // For Cash request: Confirm payment and issue pass immediately
        if (pendingPayment) {
          await tx.payment.update({
            where: { id: pendingPayment.id },
            data: { status: PaymentStatus.CONFIRMED },
          });
        }

        await tx.registration.update({
          where: { id: registrationId },
          data: { status: RegistrationStatus.PASS_ISSUED },
        });

        await this.credentialsService.generateCredentialsForRegistration(registrationId, tx);
        const fullCredentials = await tx.credential.findMany({
          where: { registrationId: registrationId },
        });

        await tx.auditLog.create({
          data: {
            actorId: adminId,
            action: 'CASHIER_REQUEST_APPROVED',
            targetEntity: 'Registration',
            targetId: registrationId,
            payload: { credentialsCount: fullCredentials.length },
          },
        });

        return { success: true, message: 'Cash request approved and passes issued' };
      }
    });
  }

  async rejectCashierRequest(registrationId: string, adminId: string, reason?: string) {
    return await this.prisma.$transaction(async (tx) => {
      const reg = await tx.registration.findUnique({
        where: { id: registrationId },
        include: { payments: true },
      });
      if (!reg) throw new NotFoundException('Registration not found');
      if (reg.status !== RegistrationStatus.CASHIER_PENDING) {
        throw new BadRequestException('Registration is not pending cashier approval');
      }

      const pendingPayment = reg.payments.find(p => p.status === PaymentStatus.PENDING);
      if (pendingPayment) {
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: { status: PaymentStatus.CANCELLED },
        });
      }

      await tx.registration.update({
        where: { id: registrationId },
        data: { 
          status: RegistrationStatus.REJECTED,
          reviewNotes: reason || 'Rejected by Admin',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'CASHIER_REQUEST_REJECTED',
          targetEntity: 'Registration',
          targetId: registrationId,
          payload: { reason },
        },
      });

      return { success: true, message: 'Request rejected' };
    });
  }

  async deletePayment(id: string, adminId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
        include: { registration: true }
      });
      if (!payment) throw new NotFoundException('Payment record not found');

      // Delete payment
      await tx.payment.delete({ where: { id } });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'PAYMENT_RECORD_DELETED',
          targetEntity: 'Payment',
          targetId: id,
          payload: {
            receiptNumber: payment.receiptNumber,
            amount: Number(payment.amount),
            registrationNumber: payment.registration?.registrationNumber,
          }
        }
      });

      // Check if there are other confirmed payments for this registration
      const regId = payment.registrationId;
      if (regId) {
        const remainingConfirmedPayments = await tx.payment.findMany({
          where: { registrationId: regId, status: PaymentStatus.CONFIRMED },
        });

        if (remainingConfirmedPayments.length === 0) {
          // Revert registration status to PAYMENT_PENDING
          await tx.registration.update({
            where: { id: regId },
            data: { status: RegistrationStatus.PAYMENT_PENDING },
          });

          // Cancel credentials if any exist
          await tx.credential.updateMany({
            where: { registrationId: regId },
            data: { status: CredentialStatus.CANCELLED },
          });
        }
      }

      return { success: true, message: 'Payment record deleted successfully.' };
    });
  }
}
