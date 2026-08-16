import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CredentialsService } from './credentials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Credentials')
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get('my-pass')
  @ApiOperation({ summary: 'Retrieve digital pass wallet / status via WhatsApp phone or Aadhaar number query (Public)' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  @ApiQuery({ name: 'aadhaar', required: false, type: String })
  async getMyPass(
    @Query('query') query?: string,
    @Query('phone') phone?: string,
    @Query('aadhaar') aadhaar?: string,
  ) {
    const searchVal = query || phone || aadhaar || '';
    return this.credentialsService.findMyPass(searchVal);
  }

  @Post('my-pass')
  @ApiOperation({ summary: 'Retrieve digital pass wallet / status via WhatsApp phone or Aadhaar number body (Public)' })
  async findMyPass(@Body() body: { query?: string; phone?: string; aadhaar?: string; aadhaarNumber?: string; otpToken?: string }) {
    const searchVal = body.query || body.phone || body.aadhaar || body.aadhaarNumber || '';
    return this.credentialsService.findMyPass(searchVal);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE, Role.ENTRY_VERIFICATION)
  @ApiOperation({ summary: 'Get credential detail by ID, Credential Number, or Secure Token (Staff only)' })
  async findOne(@Param('id') id: string) {
    return this.credentialsService.findOne(id);
  }
}
