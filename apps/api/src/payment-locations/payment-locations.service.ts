import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentLocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const locations = await this.prisma.paymentLocation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: locations };
  }

  async create(data: { name: string; address?: string }) {
    const location = await this.prisma.paymentLocation.create({
      data: {
        name: data.name,
        address: data.address,
        isActive: true,
      },
    });
    return { success: true, data: location, message: 'Payment counter created successfully' };
  }
}
