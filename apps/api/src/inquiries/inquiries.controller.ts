import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, InquiryStatus } from '@prisma/client';

@ApiTags('Sponsor & Stall Inquiries')
@Controller('')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post('sponsor-inquiries')
  @ApiOperation({ summary: 'Submit public Sponsor Inquiry (Public)' })
  async createSponsorInquiry(
    @Body()
    body: {
      companyName: string;
      contactName: string;
      phone: string;
      email?: string;
      sponsorshipType?: string;
      notes?: string;
    },
  ) {
    return this.inquiriesService.createSponsorInquiry(body);
  }

  @Post('stall-inquiries')
  @ApiOperation({ summary: 'Submit public Stall Application (Public)' })
  async createStallInquiry(
    @Body()
    body: {
      brandName: string;
      contactName: string;
      phone: string;
      category?: string;
      notes?: string;
    },
  ) {
    return this.inquiriesService.createStallInquiry(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Get('sponsor-inquiries')
  @ApiOperation({ summary: 'List all sponsor inquiries (Staff only)' })
  @ApiQuery({ name: 'status', required: false, enum: InquiryStatus })
  async findAllSponsors(@Query('status') status?: InquiryStatus) {
    return this.inquiriesService.findAllSponsorInquiries(status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Get('stall-inquiries')
  @ApiOperation({ summary: 'List all stall inquiries (Staff only)' })
  @ApiQuery({ name: 'status', required: false, enum: InquiryStatus })
  async findAllStalls(@Query('status') status?: InquiryStatus) {
    return this.inquiriesService.findAllStallInquiries(status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('sponsor-inquiries/:id/status')
  @ApiOperation({ summary: 'Update sponsor inquiry status (Super Admin only)' })
  async updateSponsorStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { status: InquiryStatus },
  ) {
    return this.inquiriesService.updateSponsorStatus(id, body.status, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('stall-inquiries/:id/status')
  @ApiOperation({ summary: 'Update stall inquiry status (Super Admin only)' })
  async updateStallStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { status: InquiryStatus },
  ) {
    return this.inquiriesService.updateStallStatus(id, body.status, req.user.id);
  }
}
