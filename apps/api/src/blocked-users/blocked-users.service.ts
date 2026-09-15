import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class BlockedUsersService {
  private readonly logger = new Logger(BlockedUsersService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async findAll() {
    const records = await this.prisma.blockedUser.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        blockedBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    return { success: true, data: records };
  }

  async isBlocked(phone?: string, aadhaarHmac?: string) {
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : null;
    const conditions: any[] = [];

    if (cleanPhone && cleanPhone.length === 10) {
      conditions.push({ phone: cleanPhone });
    }
    if (aadhaarHmac) {
      conditions.push({ aadhaarHmac });
    }

    if (conditions.length === 0) return null;

    return this.prisma.blockedUser.findFirst({
      where: { OR: conditions },
    });
  }

  async blockUser(dto: {
    phone: string;
    fullName?: string;
    aadhaarNumber?: string;
    aadhaarHmac?: string;
    aadhaarMasked?: string;
    reason?: string;
    actorId?: string;
  }) {
    const cleanPhone = dto.phone ? dto.phone.replace(/\D/g, '').slice(-10) : '';
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new BadRequestException('A valid 10-digit mobile number is required to block a user.');
    }

    let hmac = dto.aadhaarHmac;
    let masked = dto.aadhaarMasked;

    if (dto.aadhaarNumber) {
      const cleanAadhaar = dto.aadhaarNumber.replace(/\D/g, '');
      if (cleanAadhaar.length === 12) {
        hmac = this.encryptionService.computeAadhaarHmac(cleanAadhaar);
        masked = `XXXX-XXXX-${cleanAadhaar.slice(-4)}`;
      }
    }

    // Check if an existing block record matches this phone or aadhaar
    const existing = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(hmac ? [{ aadhaarHmac: hmac }] : []),
        ],
      },
    });

    let record;
    if (existing) {
      record = await this.prisma.blockedUser.update({
        where: { id: existing.id },
        data: {
          fullName: dto.fullName || existing.fullName,
          aadhaarHmac: hmac || existing.aadhaarHmac,
          aadhaarMasked: masked || existing.aadhaarMasked,
          reason: dto.reason || existing.reason,
          blockedById: dto.actorId || existing.blockedById,
        },
      });
    } else {
      record = await this.prisma.blockedUser.create({
        data: {
          phone: cleanPhone,
          fullName: dto.fullName?.trim() || null,
          aadhaarHmac: hmac || null,
          aadhaarMasked: masked || null,
          reason: dto.reason?.trim() || 'Blocked by administration',
          blockedById: dto.actorId || null,
        },
      });
    }

    if (dto.actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: dto.actorId,
          action: 'USER_BLOCKED',
          targetEntity: 'BlockedUser',
          targetId: record.id,
          payload: {
            phone: cleanPhone,
            fullName: record.fullName,
            reason: record.reason,
          },
        },
      });
    }

    return {
      success: true,
      data: record,
      message: `User ${record.fullName ? `(${record.fullName}) ` : ''}+91${cleanPhone} added to block list.`,
    };
  }

  async blockRegistration(
    registrationId: string,
    attendeeIds?: string[],
    reason?: string,
    actorId?: string,
  ) {
    const reg = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        attendees: {
          include: {
            attendee: true,
          },
        },
      },
    });

    if (!reg) {
      throw new NotFoundException('Registration application not found');
    }

    const attendeesToBlock = (attendeeIds && attendeeIds.length > 0)
      ? reg.attendees.filter((ra) => attendeeIds.includes(ra.attendeeId))
      : reg.attendees;

    if (attendeesToBlock.length === 0) {
      throw new BadRequestException('No attendees selected for blocking');
    }

    const blockedList = [];
    for (const ra of attendeesToBlock) {
      const att = ra.attendee;
      if (!att) continue;

      const cleanPhone = (att.phone || '').replace(/\D/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length !== 10) continue;

      const res = await this.blockUser({
        phone: cleanPhone,
        fullName: att.fullName,
        aadhaarHmac: att.aadhaarHmac,
        aadhaarMasked: att.aadhaarMasked,
        reason: reason || `Blocked from Registration #${reg.registrationNumber}`,
        actorId,
      });
      blockedList.push(res.data);
    }

    return {
      success: true,
      data: blockedList,
      message: `Successfully blocked ${blockedList.length} attendee(s) from Registration #${reg.registrationNumber}.`,
    };
  }

  async unblockUser(id: string, actorId?: string) {
    const existing = await this.prisma.blockedUser.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Blocked user record not found');
    }

    await this.prisma.blockedUser.delete({
      where: { id },
    });

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'USER_UNBLOCKED',
          targetEntity: 'BlockedUser',
          targetId: id,
          payload: {
            phone: existing.phone,
            fullName: existing.fullName,
            reason: existing.reason,
          },
        },
      });
    }

    return {
      success: true,
      message: `User ${existing.fullName ? `(${existing.fullName}) ` : ''}+91${existing.phone} has been unblocked.`,
    };
  }
}
