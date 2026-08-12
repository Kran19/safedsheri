import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScanResult } from '@prisma/client';

@Injectable()
export class ScanAttemptsService {
  constructor(private prisma: PrismaService) {}

  async findAll(result?: ScanResult) {
    const where: any = {};
    if (result) where.result = result;

    const scans = await this.prisma.scanAttempt.findMany({
      where,
      include: {
        scannedBy: {
          select: { id: true, fullName: true, role: true },
        },
        credential: {
          select: { id: true, credentialNumber: true },
        },
      },
      orderBy: { scannedAt: 'desc' },
      take: 100,
    });

    return { success: true, data: scans };
  }
}
