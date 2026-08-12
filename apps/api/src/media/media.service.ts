import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const media = await this.prisma.media.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { success: true, data: media };
  }

  async create(data: { title: string; mediaType: string; filePath: string; section?: string }) {
    const media = await this.prisma.media.create({
      data: {
        title: data.title,
        mediaType: data.mediaType,
        filePath: data.filePath,
        section: data.section || 'GENERAL',
      },
    });
    return { success: true, data: media, message: 'Media entry created successfully' };
  }
}
