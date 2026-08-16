import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationStatus, PassType, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('active-phase')
  getActivePhase() {
    return this.registrationsService.getActivePhase();
  }

  @Get('phases')
  getAllPhases() {
    return this.registrationsService.getAllPhases();
  }

  @Post('pricing-settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  updatePricingSettings(@Body() body: any, @Request() req: any) {
    return this.registrationsService.updatePricingSettings(body, req.user?.id);
  }

  @Post('public')
  createPublicRegistration(
    @Body()
    body: {
      passType: PassType;
      attendees: any[];
    },
  ) {
    return this.registrationsService.createPublicRegistration(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  findAll(
    @Query('status') status?: RegistrationStatus,
    @Query('passType') passType?: PassType,
    @Query('search') search?: string,
  ) {
    return this.registrationsService.findAll(status, passType, search);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  findOne(@Param('id') id: string) {
    return this.registrationsService.findOne(id);
  }

  @Post(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  reviewRegistration(
    @Param('id') id: string,
    @Body()
    body: {
      globalNotes?: string;
      attendeeDecisions?: Array<{
        attendeeId: string;
        status: RegistrationStatus;
        reviewNotes?: string;
      }>;
    },
    @Request() req: any,
  ) {
    return this.registrationsService.reviewRegistration(id, req.user.id, body);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  approveRegistration(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    return this.registrationsService.approveRegistration(id, req.user.id, body?.notes);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  rejectRegistration(
    @Param('id') id: string,
    @Body() body: { notes: string },
    @Request() req: any,
  ) {
    return this.registrationsService.rejectRegistration(id, req.user.id, body?.notes);
  }
}
