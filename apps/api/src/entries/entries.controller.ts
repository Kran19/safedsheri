import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EntriesService } from './entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, EntryType } from '@prisma/client';

@ApiTags('Entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE, Role.ENTRY_VERIFICATION)
  @ApiOperation({ summary: 'List successful venue entries' })
  @ApiQuery({ name: 'type', required: false, enum: EntryType })
  async findAll(@Query('type') type?: EntryType) {
    return this.entriesService.findAll(type);
  }

  @Post('scan')
  @Roles(Role.SUPER_ADMIN, Role.ENTRY_VERIFICATION)
  @ApiOperation({ summary: 'Low-latency QR Scan Validation (Atomic row locking over 5G)' })
  async scanQr(@Request() req, @Body() body: { token: string }) {
    return this.entriesService.scanQr({
      token: body.token,
      scannedById: req.user.id,
    });
  }

  @Post('direct')
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @ApiOperation({ summary: 'Direct Walk-in Entry by Finance/Admin' })
  async directEntry(@Request() req, @Body() body: { fullName: string; phone?: string; notes?: string }) {
    return this.entriesService.directEntry({
      ...body,
      verifiedById: req.user.id,
    });
  }
}
