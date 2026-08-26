import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GazeboStatus, GazeboInquiryStatus } from '@prisma/client';

@Injectable()
export class GazebosService {
  constructor(private prisma: PrismaService) {}

  // PUBLIC: Get real backend spatial inventory counts
  async getAvailability() {
    const gazebos = await this.prisma.gazebo.findMany();

    const calculateLevelStats = (levelNum: number, defaultPrice: number) => {
      const levelUnits = gazebos.filter((g) => g.level === levelNum);
      const availableUnits = levelUnits.filter((g) => g.status === GazeboStatus.AVAILABLE);
      const price = levelUnits.length > 0 ? Number(levelUnits[0].price) : defaultPrice;

      return {
        level: levelNum,
        price,
        total: levelUnits.length > 0 ? levelUnits.length : 4,
        available: availableUnits.length,
      };
    };

    return {
      success: true,
      data: {
        level1: calculateLevelStats(1, 85000),
        level2: calculateLevelStats(2, 100000),
        level3: calculateLevelStats(3, 125000),
      },
    };
  }

  // PUBLIC: Create Gazebo Inquiry (DOES NOT CONSUME INVENTORY, NO PAYMENTS/QRS)
  async createInquiry(data: {
    level: number;
    fullName: string;
    phone: string;
    notes?: string;
  }) {
    if (![1, 2, 3].includes(data.level)) {
      throw new BadRequestException('Level must be 1, 2, or 3');
    }
    if (!data.fullName || data.fullName.trim().length === 0) {
      throw new BadRequestException('Full name is required');
    }
    if (!data.phone || data.phone.trim().length < 10) {
      throw new BadRequestException('Valid WhatsApp phone number is required');
    }

    const count = await this.prisma.gazeboInquiry.count();
    const seq = (count + 101).toString().padStart(6, '0');
    const inquiryNumber = `GZB-INQ-${seq}`;

    const inquiry = await this.prisma.gazeboInquiry.create({
      data: {
        inquiryNumber,
        level: data.level,
        fullName: data.fullName,
        phone: data.phone,
        notes: data.notes,
        status: GazeboInquiryStatus.NEW,
        gazeboId: null, // Public inquiries start with NO physical gazebo assigned
      },
    });

    // Get system/admin user for audit log
    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (adminUser) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminUser.id,
          action: 'INQUIRY_CREATED',
          targetEntity: 'GazeboInquiry',
          targetId: inquiry.id,
          payload: { inquiryNumber, level: data.level },
        },
      });
    }

    return {
      success: true,
      data: {
        inquiryNumber: inquiry.inquiryNumber,
        level: inquiry.level,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      },
      message: `YOUR ENQUIRY HAS BEEN RECEIVED. Reference: ${inquiry.inquiryNumber}. Our team will contact you personally to discuss availability and arrangements.`,
    };
  }

  // STAFF: List all Gazebo Inquiries
  async findAllInquiries(level?: number, status?: GazeboInquiryStatus) {
    const where: any = {};
    if (level) where.level = level;
    if (status) where.status = status;

    const inquiries = await this.prisma.gazeboInquiry.findMany({
      where,
      include: { gazebo: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: inquiries };
  }

  // STAFF: List all 12 Physical Gazebos with linked active inquiries
  async findAllGazebos() {
    const gazebos = await this.prisma.gazebo.findMany({
      include: {
        inquiries: {
          where: {
            status: { in: [GazeboInquiryStatus.CONFIRMED, GazeboInquiryStatus.HOLD, GazeboInquiryStatus.APPROVED] }
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { gazeboNumber: 'asc' },
    });
    return { success: true, data: gazebos };
  }

  // ADMIN: Direct Booking / Allocation of a Gazebo
  async bookGazeboDirect(
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      email?: string;
      amount?: number;
      notes?: string;
      status?: 'CONFIRMED' | 'HOLD';
    },
    actorId: string,
  ) {
    const gazebo = await this.prisma.gazebo.findUnique({
      where: { id },
      include: {
        inquiries: {
          where: { status: { in: [GazeboInquiryStatus.CONFIRMED, GazeboInquiryStatus.HOLD] } },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!gazebo) {
      throw new NotFoundException('Gazebo not found');
    }

    const targetStatus = data.status === 'HOLD' ? GazeboStatus.HELD : GazeboStatus.CONFIRMED;
    const inquiryStatus = data.status === 'HOLD' ? GazeboInquiryStatus.HOLD : GazeboInquiryStatus.CONFIRMED;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update Gazebo status
      const updatedGazebo = await tx.gazebo.update({
        where: { id },
        data: {
          status: targetStatus,
          price: data.amount ? data.amount : gazebo.price,
        },
      });

      // 2. Prepare Guest Contact Info
      const fullName = data.fullName?.trim() || `VIP Host (Gazebo ${gazebo.gazeboNumber})`;
      const phone = data.phone?.trim() || '+91 99999 99999';
      const formattedNotes = [
        data.email ? `Email: ${data.email.trim()}` : null,
        data.amount ? `Amount: ₹${Number(data.amount).toLocaleString()}` : null,
        data.notes ? `Notes: ${data.notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join(' | ') || `Direct booking by Super Admin`;

      let inquiry;
      if (gazebo.inquiries && gazebo.inquiries.length > 0) {
        // Update existing active inquiry
        inquiry = await tx.gazeboInquiry.update({
          where: { id: gazebo.inquiries[0].id },
          data: {
            fullName,
            phone,
            notes: formattedNotes,
            status: inquiryStatus,
          },
        });
      } else {
        // Create new inquiry
        const count = await tx.gazeboInquiry.count();
        const seq = (count + 101).toString().padStart(6, '0');
        const inquiryNumber = `GZB-ADM-${seq}`;

        inquiry = await tx.gazeboInquiry.create({
          data: {
            inquiryNumber,
            gazeboId: id,
            level: gazebo.level,
            fullName,
            phone,
            notes: formattedNotes,
            status: inquiryStatus,
          },
        });
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          action: targetStatus === GazeboStatus.CONFIRMED ? 'GAZEBO_DIRECT_BOOKED' : 'GAZEBO_DIRECT_HELD',
          targetEntity: 'Gazebo',
          targetId: id,
          payload: {
            gazeboNumber: gazebo.gazeboNumber,
            level: gazebo.level,
            fullName,
            phone,
            amount: data.amount || Number(gazebo.price),
            status: targetStatus,
          },
        },
      });

      return {
        success: true,
        data: {
          gazebo: {
            ...updatedGazebo,
            inquiries: [inquiry],
          },
          inquiry,
        },
        message: `Gazebo ${gazebo.gazeboNumber} successfully marked as ${targetStatus}!`,
      };
    });
  }

  // ADMIN: Release a Gazebo back to Available
  async releaseGazebo(id: string, actorId: string) {
    const gazebo = await this.prisma.gazebo.findUnique({
      where: { id },
      include: { inquiries: true },
    });

    if (!gazebo) {
      throw new NotFoundException('Gazebo not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Reset Gazebo status to AVAILABLE
      const updatedGazebo = await tx.gazebo.update({
        where: { id },
        data: { status: GazeboStatus.AVAILABLE },
      });

      // 2. Mark active inquiries as CANCELLED
      await tx.gazeboInquiry.updateMany({
        where: {
          gazeboId: id,
          status: { in: [GazeboInquiryStatus.CONFIRMED, GazeboInquiryStatus.HOLD, GazeboInquiryStatus.APPROVED] },
        },
        data: {
          status: GazeboInquiryStatus.CANCELLED,
          notes: 'Released back to available inventory by Super Admin',
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'GAZEBO_RELEASED_TO_AVAILABLE',
          targetEntity: 'Gazebo',
          targetId: id,
          payload: { gazeboNumber: gazebo.gazeboNumber, level: gazebo.level },
        },
      });

      return {
        success: true,
        data: updatedGazebo,
        message: `Gazebo ${gazebo.gazeboNumber} has been released and is now AVAILABLE.`,
      };
    });
  }

  // STAFF: Update Inquiry Status with PostgreSQL Row-Level Concurrency Locks
  async updateInquiryStatus(
    id: string,
    data: {
      status: GazeboInquiryStatus;
      gazeboId?: string;
      notes?: string;
    },
    actorId: string,
  ) {
    const existingInquiry = await this.prisma.gazeboInquiry.findUnique({
      where: { id },
      include: { gazebo: true },
    });

    if (!existingInquiry) {
      throw new NotFoundException('Gazebo inquiry not found');
    }

    const updatedInquiry = await this.prisma.$transaction(async (tx) => {
      let targetGazeboId = data.gazeboId || existingInquiry.gazeboId;

      // Handle HOLD transition
      if (data.status === GazeboInquiryStatus.HOLD) {
        if (!targetGazeboId) {
          throw new BadRequestException('A specific physical Gazebo must be selected to place on HOLD');
        }

        // Row locking over physical Gazebo unit
        const lockedGazebos: any[] = await tx.$queryRaw`
          SELECT id, "gazeboNumber", level, status FROM "Gazebo" WHERE id = ${targetGazeboId} FOR UPDATE
        `;

        if (!lockedGazebos || lockedGazebos.length === 0) {
          throw new NotFoundException('Target physical Gazebo not found');
        }

        const lockedGazebo = lockedGazebos[0];
        if (lockedGazebo.status !== GazeboStatus.AVAILABLE && lockedGazebo.id !== existingInquiry.gazeboId) {
          throw new ConflictException(`Gazebo ${lockedGazebo.gazeboNumber} is currently ${lockedGazebo.status} by another operation.`);
        }

        await tx.gazebo.update({
          where: { id: targetGazeboId },
          data: { status: GazeboStatus.HELD },
        });

        await tx.auditLog.create({
          data: {
            actorId,
            action: 'GAZEBO_HELD',
            targetEntity: 'Gazebo',
            targetId: targetGazeboId,
            payload: { inquiryId: id, gazeboNumber: lockedGazebo.gazeboNumber },
          },
        });
      }

      // Handle CONFIRMED transition
      if (data.status === GazeboInquiryStatus.CONFIRMED) {
        if (!targetGazeboId) {
          throw new BadRequestException('A specific physical Gazebo must be selected to CONFIRM');
        }

        const lockedGazebos: any[] = await tx.$queryRaw`
          SELECT id, "gazeboNumber", level, status FROM "Gazebo" WHERE id = ${targetGazeboId} FOR UPDATE
        `;

        if (!lockedGazebos || lockedGazebos.length === 0) {
          throw new NotFoundException('Target physical Gazebo not found');
        }

        const lockedGazebo = lockedGazebos[0];
        if (lockedGazebo.status === GazeboStatus.CONFIRMED && lockedGazebo.id !== existingInquiry.gazeboId) {
          throw new ConflictException(`Gazebo ${lockedGazebo.gazeboNumber} is already CONFIRMED.`);
        }

        await tx.gazebo.update({
          where: { id: targetGazeboId },
          data: { status: GazeboStatus.CONFIRMED },
        });

        await tx.auditLog.create({
          data: {
            actorId,
            action: 'GAZEBO_CONFIRMED',
            targetEntity: 'Gazebo',
            targetId: targetGazeboId,
            payload: { inquiryId: id, gazeboNumber: lockedGazebo.gazeboNumber },
          },
        });
      }

      // Handle REJECTED / CANCELLED (Release physical gazebo if assigned)
      if (
        (data.status === GazeboInquiryStatus.REJECTED || data.status === GazeboInquiryStatus.CANCELLED) &&
        existingInquiry.gazeboId
      ) {
        await tx.gazebo.update({
          where: { id: existingInquiry.gazeboId },
          data: { status: GazeboStatus.AVAILABLE },
        });

        await tx.auditLog.create({
          data: {
            actorId,
            action: 'GAZEBO_RELEASED',
            targetEntity: 'Gazebo',
            targetId: existingInquiry.gazeboId,
            payload: { inquiryId: id },
          },
        });
      }

      // Update Inquiry status
      const updated = await tx.gazeboInquiry.update({
        where: { id },
        data: {
          status: data.status,
          gazeboId: targetGazeboId || null,
          notes: data.notes !== undefined ? data.notes : existingInquiry.notes,
        },
        include: { gazebo: true },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'INQUIRY_STATUS_CHANGED',
          targetEntity: 'GazeboInquiry',
          targetId: id,
          payload: { from: existingInquiry.status, to: data.status },
        },
      });

      return updated;
    });

    return {
      success: true,
      data: updatedInquiry,
      message: `Inquiry ${updatedInquiry.inquiryNumber} status updated to ${updatedInquiry.status}`,
    };
  }
}
