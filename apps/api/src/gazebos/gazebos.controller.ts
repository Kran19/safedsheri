import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GazebosService } from './gazebos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, GazeboInquiryStatus } from '@prisma/client';

@ApiTags('Gazebos')
@Controller('')
export class GazebosController {
  constructor(private readonly gazebosService: GazebosService) {}

  @Get('gazebos/availability')
  @ApiOperation({ summary: 'Get real backend physical gazebo availability counts (Public)' })
  async getAvailability() {
    return this.gazebosService.getAvailability();
  }

  @Post('gazebo-inquiries')
  @ApiOperation({ summary: 'Submit a public Gazebo inquiry (Enquiry Only, 0 inventory deduction)' })
  async createInquiry(
    @Body()
    body: {
      level: number;
      fullName: string;
      phone: string;
      notes?: string;
    },
  ) {
    return this.gazebosService.createInquiry(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Get('gazebos')
  @ApiOperation({ summary: 'List all 12 physical gazebos and inventory states (Staff only)' })
  async findAllGazebos() {
    return this.gazebosService.findAllGazebos();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Get('gazebos/inquiries')
  @ApiOperation({ summary: 'List all gazebo inquiries (Staff only)' })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'status', required: false, enum: GazeboInquiryStatus })
  async findAllInquiries(
    @Query('level') level?: string,
    @Query('status') status?: GazeboInquiryStatus,
  ) {
    const levelNum = level ? parseInt(level, 10) : undefined;
    return this.gazebosService.findAllInquiries(levelNum, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('gazebos/:id/book')
  @ApiOperation({ summary: 'Directly book or place a physical gazebo on hold (Super Admin only)' })
  async bookGazebo(
    @Param('id') id: string,
    @Request() req,
    @Body()
    body: {
      fullName?: string;
      phone?: string;
      email?: string;
      amount?: number;
      notes?: string;
      status?: 'CONFIRMED' | 'HOLD';
    },
  ) {
    return this.gazebosService.bookGazeboDirect(id, body, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('gazebos/:id/release')
  @ApiOperation({ summary: 'Release a physical gazebo back to AVAILABLE (Super Admin only)' })
  async releaseGazebo(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.gazebosService.releaseGazebo(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('gazebos/inquiries/:id/status')
  @ApiOperation({ summary: 'Update gazebo inquiry status & assign physical gazebo with row locks (Super Admin only)' })
  async updateInquiryStatus(
    @Param('id') id: string,
    @Request() req,
    @Body()
    body: {
      status: GazeboInquiryStatus;
      gazeboId?: string;
      notes?: string;
    },
  ) {
    return this.gazebosService.updateInquiryStatus(id, body, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Post('gazebos/:id/guests')
  @ApiOperation({ summary: 'Add up to 14 guests to a physical Gazebo and instantly mint passes (Staff only)' })
  async addGuestsToGazebo(
    @Param('id') id: string,
    @Request() req,
    @Body()
    body: {
      attendees: Array<{
        fullName: string;
        phone: string;
        email?: string;
        gender: string;
        aadhaarNumber?: string;
        documentFrontKey?: string;
        documentFrontName?: string;
        documentBackKey?: string;
        documentBackName?: string;
      }>;
    },
  ) {
    return this.gazebosService.addGuestsToGazebo(id, body, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Post('gazebos/:id/invite-link')
  @ApiOperation({ summary: 'Generate a secure invite link token for a Gazebo' })
  async generateInviteLink(@Param('id') id: string, @Request() req) {
    return this.gazebosService.generateInviteLink(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Delete('gazebos/:id/invite-link')
  @ApiOperation({ summary: 'Revoke/remove the invite link token for a Gazebo' })
  async revokeInviteLink(@Param('id') id: string, @Request() req) {
    return this.gazebosService.revokeInviteLink(id, req.user.id);
  }

  @Get('auth/gazebo-invite/:token')
  @ApiOperation({ summary: 'Get Gazebo and host details using a secure invite token (Public)' })
  async getInviteDetails(@Param('token') token: string) {
    return this.gazebosService.getInviteDetails(token);
  }

  @Post('auth/gazebo-invite/:token/submit')
  @ApiOperation({ summary: 'Submit guest details and verify OTP for a Gazebo booking (Public)' })
  async submitInviteGuests(
    @Param('token') token: string,
    @Body()
    body: {
      attendees: Array<{
        fullName: string;
        phone: string;
        email?: string;
        gender: string;
        aadhaarNumber?: string;
        documentFrontKey?: string;
        documentFrontName?: string;
        documentBackKey?: string;
        documentBackName?: string;
      }>;
      otpToken?: string;
    },
  ) {
    return this.gazebosService.submitInviteGuests(token, body);
  }
}
