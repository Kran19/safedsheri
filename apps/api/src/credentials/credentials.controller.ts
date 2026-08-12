import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CredentialsService } from './credentials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Credentials')
@Controller('api/v1/credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post('my-pass')
  @ApiOperation({ summary: 'Retrieve digital pass wallet / status via WhatsApp phone number (Public)' })
  async findMyPass(@Body() body: { phone: string; otpToken?: string }) {
    return this.credentialsService.findMyPass(body.phone);
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
