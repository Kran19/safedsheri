import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendeesService } from './attendees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, Gender } from '@prisma/client';

@ApiTags('Attendees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
@Controller('attendees')
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Get()
  @ApiOperation({ summary: 'Search & list attendees' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or phone' })
  async findAll(@Query('search') search?: string) {
    return this.attendeesService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendee details by ID' })
  async findOne(@Param('id') id: string) {
    return this.attendeesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new attendee' })
  async create(@Body() body: { fullName: string; phone: string; email?: string; aadhaarNumber: string }) {
    return this.attendeesService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update attendee details (Super Admin / Ticketing only)' })
  async update(
    @Param('id') id: string,
    @Body() body: { fullName?: string; phone?: string; email?: string; gender?: Gender; aadhaarNumber?: string }
  ) {
    return this.attendeesService.update(id, body);
  }
}
