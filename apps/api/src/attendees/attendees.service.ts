import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class AttendeesService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const attendees = await this.prisma.attendee.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        aadhaarMasked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { success: true, data: attendees };
  }

  async findOne(id: string) {
    const attendee = await this.prisma.attendee.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        aadhaarMasked: true,
        createdAt: true,
        registrations: {
          select: {
            isPrimary: true,
            registration: {
              select: {
                id: true,
                registrationNumber: true,
                status: true,
                amountDue: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }
    return { success: true, data: attendee };
  }

  async create(data: { fullName: string; phone: string; email?: string; aadhaarNumber: string }) {
    if (!data.aadhaarNumber || data.aadhaarNumber.trim().length === 0) {
      throw new BadRequestException('Aadhaar number is mandatory');
    }
    const aadhaarMasked = this.encryptionService.maskAadhaar(data.aadhaarNumber);
    const aadhaarEncrypted = this.encryptionService.encrypt(data.aadhaarNumber);

    const attendee = await this.prisma.attendee.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        aadhaarMasked,
        aadhaarEncrypted,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        aadhaarMasked: true,
        createdAt: true,
      },
    });

    return { success: true, data: attendee, message: 'Attendee created successfully' };
  }
}
