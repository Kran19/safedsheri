import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, RegistrationStatus } from '@prisma/client';

@ApiTags('Registrations')
@Controller('api/v1/registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('active-phase')
  @ApiOperation({ summary: 'Get current active pricing phase (Public)' })
  async getActivePhase() {
    return this.registrationsService.getActivePhase();
  }

  @Post('public')
  @ApiOperation({ summary: 'Public Registration Booking Submission (No Pass Issued Yet)' })
  async createPublicRegistration(
    @Body()
    body: {
      passType: 'SINGLE' | 'COUPLE';
      attendees: Array<{
        fullName: string;
        phone: string;
        email?: string;
        aadhaarNumber: string;
      }>;
    },
  ) {
    return this.registrationsService.createPublicRegistration(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('all-phases')
  @ApiOperation({ summary: 'Get all pricing phases (Super Admin only)' })
  async getAllPhases() {
    return this.registrationsService.getAllPhases();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('active-phase/:id')
  @ApiOperation({ summary: 'Switch active pricing phase (Super Admin only)' })
  async setActivePhase(@Param('id') id: string, @Request() req) {
    return this.registrationsService.setActivePhase(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Get()
  @ApiOperation({ summary: 'List all registrations with optional search/status filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: RegistrationStatus })
  async findAll(@Query('search') search?: string, @Query('status') status?: RegistrationStatus) {
    return this.registrationsService.findAll(search, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Get(':id')
  @ApiOperation({ summary: 'Get registration details by ID or registration number' })
  async findOne(@Param('id') id: string) {
    return this.registrationsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @Post()
  @ApiOperation({ summary: 'Create new registration at ticketing counter' })
  async create(
    @Request() req,
    @Body()
    body: {
      passType: 'SINGLE' | 'COUPLE';
      attendees: Array<{
        fullName: string;
        phone: string;
        email?: string;
        aadhaarNumber: string;
      }>;
    },
  ) {
    return this.registrationsService.create({
      ...body,
      createdById: req.user.id,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel registration and revoke credentials (Super Admin only)' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.registrationsService.cancel(id, req.user.id);
  }
}
