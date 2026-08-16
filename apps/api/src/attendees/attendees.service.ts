import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { Gender } from '@prisma/client';

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
            { aadhaarMasked: { contains: search } },
          ],
        }
      : {};

    const attendees = await this.prisma.attendee.findMany({
      where,
      include: {
        document: true,
        credentials: {
          select: {
            id: true,
            passCode: true,
            status: true,
          },
        },
        registrations: {
          include: {
            registration: {
              select: {
                id: true,
                registrationNumber: true,
                passType: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    return { success: true, data: attendees };
  }

  async findOne(id: string) {
    const attendee = await this.prisma.attendee.findUnique({
      where: { id },
      include: {
        document: true,
        credentials: true,
        registrations: {
          include: {
            registration: true,
          },
        },
      },
    });
    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }
    return { success: true, data: attendee };
  }

  async create(data: {
    fullName: string;
    phone: string;
    email?: string;
    gender?: Gender;
    aadhaarNumber: string;
  }) {
    if (!data.aadhaarNumber || data.aadhaarNumber.trim().length === 0) {
      throw new BadRequestException('Aadhaar number is mandatory');
    }
    const aadhaarMasked = this.encryptionService.maskAadhaar(data.aadhaarNumber);
    const aadhaarEncrypted = this.encryptionService.encrypt(data.aadhaarNumber);
    const aadhaarHmac = this.encryptionService.computeAadhaarHmac(data.aadhaarNumber);

    const attendee = await this.prisma.attendee.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        gender: data.gender || Gender.FEMALE,
        aadhaarHmac,
        aadhaarMasked,
        aadhaarEncrypted,
      },
      include: {
        document: true,
      },
    });

    return { success: true, data: attendee, message: 'Attendee created successfully' };
  }
}
