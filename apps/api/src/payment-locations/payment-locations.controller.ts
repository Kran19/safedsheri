import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentLocationsService } from './payment-locations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Payment Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/payment-locations')
export class PaymentLocationsController {
  constructor(private readonly locationsService: PaymentLocationsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @ApiOperation({ summary: 'List active physical payment counters' })
  async findAll() {
    return this.locationsService.findAll();
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create physical payment counter (Super Admin only)' })
  async create(@Body() body: { name: string; address?: string }) {
    return this.locationsService.create(body);
  }
}
