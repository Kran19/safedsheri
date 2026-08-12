import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List recorded cash payments' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'collectedById', required: false })
  async findAll(@Query('locationId') locationId?: string, @Query('collectedById') collectedById?: string) {
    return this.paymentsService.findAll(locationId, collectedById);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment receipt details' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record cash payment & automatically issue active QR pass credential (Option A Transactional)' })
  async recordPayment(
    @Request() req,
    @Body()
    body: {
      registrationId: string;
      paymentLocationId: string;
      amount: number;
      notes?: string;
    },
  ) {
    return this.paymentsService.recordPayment({
      ...body,
      collectedById: req.user.id,
    });
  }
}
