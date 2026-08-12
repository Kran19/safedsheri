import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CredentialsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const credential = await this.prisma.credential.findFirst({
      where: {
        OR: [{ id }, { secureToken: id }, { credentialNumber: id }],
      },
      include: {
        attendee: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        registration: {
          select: {
            id: true,
            registrationNumber: true,
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

  async findMyPass(phone: string) {
    if (!phone || phone.trim().length < 10) {
      throw new BadRequestException('Valid phone number is required to access My Pass wallet');
    }
    const cleanPhone = phone.replace(/\s+/g, '');

    // Search for attendees matching phone number
    const attendees = await this.prisma.attendee.findMany({
      where: { phone: { contains: cleanPhone } },
      include: {
        registrations: {
          include: {
            registration: {
              include: {
                pricingPhase: true,
                credentials: true,
              },
            },
          },
        },
        credentials: {
          include: {
            registration: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!attendees || attendees.length === 0) {
      return {
        success: true,
        data: null,
        message: `No booking records found for WhatsApp number ${cleanPhone}. Please register via GET YOUR PASS.`,
      };
    }

    const passes = [];

    for (const att of attendees) {
      for (const regAtt of att.registrations) {
        const reg = regAtt.registration;
        // Check if individual active credential exists for this attendee
        const activeCred = att.credentials.find(
          (c) => c.registrationId === reg.id && c.status === 'ACTIVE'
        );

        passes.push({
          attendeeId: att.id,
          attendeeName: att.fullName,
          phone: att.phone,
          registrationNumber: reg.registrationNumber,
          registrationStatus: reg.status,
          amountDue: Number(reg.amountDue),
          pricingPhaseName: reg.pricingPhase?.phaseName || 'EARLY_BIRD',
          hasActivePass: Boolean(activeCred),
          credential: activeCred
            ? {
                credentialNumber: activeCred.credentialNumber,
                secureToken: activeCred.secureToken,
                status: activeCred.status,
                issuedAt: activeCred.issuedAt,
              }
            : null,
          cashCounterInstructions:
            reg.status === 'PENDING_PAYMENT'
              ? 'Payment pending at physical cash counter. Please complete cash payment at a designated counter to activate pass.'
              : null,
        });
      }
    }

    return {
      success: true,
      data: passes,
      message: `Found ${passes.length} booking record(s) for WhatsApp number ${cleanPhone}`,
    };
  }
}
