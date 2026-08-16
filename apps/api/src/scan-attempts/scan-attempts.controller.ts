import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ScanAttemptsService } from './scan-attempts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, ScanResult } from '@prisma/client';

@ApiTags('Scan Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ENTRY_VERIFICATION)
@Controller('scan-attempts')
export class ScanAttemptsController {
  constructor(private readonly scanAttemptsService: ScanAttemptsService) {}

  @Get()
  @ApiOperation({ summary: 'List scan attempts (Valid & Rejected)' })
  @ApiQuery({ name: 'result', required: false, enum: ScanResult })
  async findAll(@Query('result') result?: ScanResult) {
    return this.scanAttemptsService.findAll(result);
  }
}
