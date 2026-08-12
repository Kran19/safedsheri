import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryStatus } from '@prisma/client';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  // PUBLIC: Submit Sponsor Inquiry
  async createSponsorInquiry(data: {
    companyName: string;
    contactName: string;
    phone: string;
    email?: string;
    sponsorshipType?: string;
    notes?: string;
  }) {
    if (!data.companyName || data.companyName.trim().length === 0) {
      throw new BadRequestException('Company / Brand name is required');
    }
    if (!data.contactName || data.contactName.trim().length === 0) {
      throw new BadRequestException('Contact person name is required');
    }
    if (!data.phone || data.phone.trim().length < 10) {
      throw new BadRequestException('Valid WhatsApp phone number is required');
    }

    const count = await this.prisma.sponsorInquiry.count();
    const seq = (count + 101).toString().padStart(6, '0');
    const inquiryNumber = `SPN-INQ-${seq}`;

    const inquiry = await this.prisma.sponsorInquiry.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        sponsorshipType: data.sponsorshipType,
        notes: data.notes,
        status: InquiryStatus.NEW,
      },
    });

    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (adminUser) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminUser.id,
          action: 'SPONSOR_INQUIRY_CREATED',
          targetEntity: 'SponsorInquiry',
          targetId: inquiry.id,
          payload: { inquiryNumber, companyName: data.companyName },
        },
      });
    }

    return {
      success: true,
      data: {
        id: inquiry.id,
        inquiryNumber,
        companyName: inquiry.companyName,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      },
      message: `YOUR SPONSORSHIP INQUIRY HAS BEEN RECEIVED. Reference: ${inquiryNumber}. Our partnership executive will contact you personally.`,
    };
  }

  // PUBLIC: Submit Stall Application
  async createStallInquiry(data: {
    brandName: string;
    contactName: string;
    phone: string;
    category?: string;
    notes?: string;
  }) {
    if (!data.brandName || data.brandName.trim().length === 0) {
      throw new BadRequestException('Brand / Stall name is required');
    }
    if (!data.contactName || data.contactName.trim().length === 0) {
      throw new BadRequestException('Contact person name is required');
    }
    if (!data.phone || data.phone.trim().length < 10) {
      throw new BadRequestException('Valid WhatsApp phone number is required');
    }

    const count = await this.prisma.stallInquiry.count();
    const seq = (count + 101).toString().padStart(6, '0');
    const inquiryNumber = `STL-INQ-${seq}`;

    const inquiry = await this.prisma.stallInquiry.create({
      data: {
        brandName: data.brandName,
        contactName: data.contactName,
        phone: data.phone,
        category: data.category,
        notes: data.notes,
        status: InquiryStatus.NEW,
      },
    });

    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (adminUser) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminUser.id,
          action: 'STALL_INQUIRY_CREATED',
          targetEntity: 'StallInquiry',
          targetId: inquiry.id,
          payload: { inquiryNumber, brandName: data.brandName },
        },
      });
    }

    return {
      success: true,
      data: {
        id: inquiry.id,
        inquiryNumber,
        brandName: inquiry.brandName,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      },
      message: `YOUR STALL APPLICATION HAS BEEN RECEIVED. Reference: ${inquiryNumber}. Our stall management team will contact you personally.`,
    };
  }

  // STAFF: List Sponsor Inquiries
  async findAllSponsorInquiries(status?: InquiryStatus) {
    const where: any = {};
    if (status) where.status = status;
    const inquiries = await this.prisma.sponsorInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: inquiries };
  }

  // STAFF: List Stall Inquiries
  async findAllStallInquiries(status?: InquiryStatus) {
    const where: any = {};
    if (status) where.status = status;
    const inquiries = await this.prisma.stallInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: inquiries };
  }

  // STAFF: Update Sponsor Inquiry Status
  async updateSponsorStatus(id: string, status: InquiryStatus, actorId: string) {
    const updated = await this.prisma.sponsorInquiry.update({
      where: { id },
      data: { status },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'SPONSOR_INQUIRY_STATUS_UPDATED',
        targetEntity: 'SponsorInquiry',
        targetId: id,
        payload: { status },
      },
    });
    return { success: true, data: updated, message: `Sponsor inquiry status updated to ${status}` };
  }

  // STAFF: Update Stall Inquiry Status
  async updateStallStatus(id: string, status: InquiryStatus, actorId: string) {
    const updated = await this.prisma.stallInquiry.update({
      where: { id },
      data: { status },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'STALL_INQUIRY_STATUS_UPDATED',
        targetEntity: 'StallInquiry',
        targetId: id,
        payload: { status },
      },
    });
    return { success: true, data: updated, message: `Stall inquiry status updated to ${status}` };
  }
}
