import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadsService } from './uploads.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('uploads')
export class UploadsController {
  constructor(
    private uploadsService: UploadsService,
    private prisma: PrismaService,
  ) {}

  @Post('aadhaar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadAadhaarDocument(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Please upload a valid Aadhaar document image/PDF.');
    }

    const saved = await this.uploadsService.saveAadhaarDocument(file);
    return {
      success: true,
      data: saved,
      message: 'Aadhaar document uploaded and encrypted successfully',
    };
  }

  @Get('document/:documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  async viewDocument(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const doc = await this.prisma.aadhaarDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new BadRequestException('Aadhaar document record not found');
    }

    const { stream } = await this.uploadsService.getDocumentFile(doc.storageKey);

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename}"`);
    stream.pipe(res);
  }
}
