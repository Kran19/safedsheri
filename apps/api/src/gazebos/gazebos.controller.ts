import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
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
}
