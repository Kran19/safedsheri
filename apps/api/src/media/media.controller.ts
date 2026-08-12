import { Controller, Get, Post, Body, Param, Res, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Content & Media')
@Controller('api/v1/content')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('media')
  @ApiOperation({ summary: 'List public/admin media assets (Promotional videos, Drone footage, Images)' })
  async findAll() {
    return this.mediaService.findAll();
  }

  @Post('media')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register new media asset (Super Admin only)' })
  async create(@Body() body: { title: string; mediaType: string; filePath: string; section?: string }) {
    return this.mediaService.create(body);
  }

  @Get('frames/:filename')
  @ApiOperation({ summary: 'Stream 330 sequential frame images (001.png to 330.png) for Canvas Scroll Engine' })
  async getFrame(@Param('filename') filename: string, @Res() res: Response) {
    const cleanFilename = path.basename(filename);
    
    // Search strategy: 1) finalstoriesimages, 2) heroAnimationImages, 3) root image sectionwise
    let framePath = path.join(process.cwd(), 'image sectionwise', 'finalstoriesimages', cleanFilename);
    
    if (!fs.existsSync(framePath)) {
      let altFilename = cleanFilename;
      if (!cleanFilename.startsWith('frame_') && cleanFilename.match(/^\d{3}\.png$/)) {
        altFilename = `frame_${cleanFilename}`;
      }
      framePath = path.join(process.cwd(), 'image sectionwise', 'heroAnimationImages', altFilename);
    }

    if (!fs.existsSync(framePath)) {
      framePath = path.join(process.cwd(), 'apps', 'admin', 'public', 'frames', cleanFilename);
    }

    if (!fs.existsSync(framePath)) {
      throw new NotFoundException(`Frame ${cleanFilename} not found`);
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'image/png');
    return res.sendFile(framePath);
  }
}
