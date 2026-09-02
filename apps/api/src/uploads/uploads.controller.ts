import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
  Res,
  UseGuards,
  Body,
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

  @Post('aadhaar/extract')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async extractAadhaar(@UploadedFile() file: any, @Body('side') side?: string) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded.');
    }
    
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException('Invalid file format for extraction. Allowed formats: JPEG, PNG, WebP');
    }

    const data = await this.uploadsService.extractAadhaarData(file.buffer, side || 'front');
    const saved = await this.uploadsService.saveAadhaarDocument(file);

    return {
      success: true,
      data: saved,
      extractedData: data,
      message: 'Aadhaar data processed successfully',
    };
  }

  @Get('document/:documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  async getDocument(
    @Param('documentId') documentId: string,
    @Query('token') token: string,
    @Query('side') side: string,
    @Res() res: Response,
  ) {
    const doc = await this.prisma.aadhaarDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new BadRequestException('Aadhaar document record not found');
    }

    const isBack = side === 'back';
    const storageKey = isBack ? doc.storageKeyBack : doc.storageKey;
    const mimeType = isBack ? doc.mimeTypeBack : doc.mimeType;
    const originalFilename = isBack ? doc.originalFilenameBack : doc.originalFilename;

    if (!storageKey) {
      throw new BadRequestException('Requested document side not found');
    }

    const { stream } = await this.uploadsService.getDocumentFile(storageKey);

    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${originalFilename || 'document'}"`);
    stream.pipe(res);
  }

  @Get('direct/:storageKey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  async getDocumentDirect(
    @Param('storageKey') storageKey: string,
    @Res() res: Response,
  ) {
    const { stream } = await this.uploadsService.getDocumentFile(storageKey);
    // Since we don't know the exact mime without the DB record, we default to image/jpeg 
    // or infer from extension
    const ext = storageKey.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'pdf') mimeType = 'application/pdf';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${storageKey}"`);
    stream.pipe(res);
  }
}
