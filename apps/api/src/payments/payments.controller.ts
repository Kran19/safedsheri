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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentMethod, PaymentStatus, Role, PassType, Gender } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Online Payments & Box Office Desk')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @ApiOperation({ summary: 'List all payment transactions' })
  findAll(@Query('status') status?: PaymentStatus) {
    return this.paymentsService.findAll(status);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @ApiOperation({ summary: 'Get comprehensive financial volume and mode stats' })
  getStats() {
    return this.paymentsService.getFinancialStats();
  }

  @Get('order/:paymentLinkId')
  @ApiOperation({ summary: 'Retrieve dynamic online order & UPI QR details for a payment link (Public)' })
  getOrderDetails(@Param('paymentLinkId') paymentLinkId: string) {
    return this.paymentsService.getOrderDetails(paymentLinkId);
  }

  @Post('manual-entry')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @ApiOperation({ summary: 'Create on-spot manual desk entry with custom amount and immediate pass minting' })
  createManualDeskEntry(
    @Body()
    body: {
      passType: PassType;
      customAmount: number;
      paymentMethod: PaymentMethod;
      attendees: Array<{
        fullName: string;
        phone: string;
        email?: string;
        gender: Gender;
        aadhaarNumber: string;
      }>;
      notes?: string;
    },
    @Request() req: any,
  ) {
    return this.paymentsService.createManualDeskEntry({
      ...body,
      staffUserId: req.user.id,
    });
  }

  @Post('upi-qr-generate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @ApiOperation({ summary: 'Generate dynamic counter UPI QR & link for an application (Desk)' })
  generateCounterUpiQr(@Body() body: { registrationId: string }) {
    return this.paymentsService.generateCounterUpiQr(body.registrationId);
  }

  @Post('send-whatsapp-link')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @ApiOperation({ summary: 'Send automated WhatsApp payment link to candidate' })
  sendWhatsAppPaymentLink(@Body() body: { registrationId: string }) {
    return this.paymentsService.sendWhatsAppPaymentLink(body.registrationId);
  }

  @Post('gateway-confirm')
  @ApiOperation({ summary: 'Authoritatively confirm online payment via UPI QR or Gateway callback (Webhook/Gateway)' })
  confirmGatewayPayment(
    @Body()
    body: {
      paymentLinkId: string;
      providerReference?: string;
      notes?: string;
      method?: PaymentMethod;
    },
  ) {
    return this.paymentsService.confirmGatewayPayment(body);
  }

  @Post('razorpay-confirm')
  @ApiOperation({ summary: 'Verify and confirm Razorpay payment signature' })
  confirmRazorpayPayment(
    @Body()
    body: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
      paymentLinkId: string;
    },
  ) {
    return this.paymentsService.confirmRazorpayPayment(body);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Payment Gateway Webhook Endpoint' })
  handleWebhook(
    @Body()
    body: {
      event: string;
      paymentLinkId: string;
      providerReference?: string;
      signature?: string;
    },
  ) {
    return this.paymentsService.confirmGatewayPayment({
      paymentLinkId: body.paymentLinkId,
      providerReference: body.providerReference,
      notes: `Webhook verified event: ${body.event}`,
      method: PaymentMethod.ONLINE_GATEWAY,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
  @ApiOperation({ summary: 'Get payment details by ID or Receipt Number' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
