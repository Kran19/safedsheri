import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.TICKETING_FINANCE)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'System operational overview metrics (Super Admin only)' })
  async getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('payments')
  @ApiOperation({ summary: 'Financial reconciliation breakdown by method and location' })
  async getPaymentsReport() {
    return this.reportsService.getPaymentsReport();
  }

  @Get('customer-contacts')
  @ApiOperation({ summary: 'Customer contact details (Email, WhatsApp) separated by Pass Category' })
  @ApiQuery({ name: 'category', required: false })
  async getCustomerContacts(@Query('category') category?: string) {
    const data = await this.reportsService.getCustomerContacts(category);
    return { success: true, data };
  }

  @Get('export-customer-pdf')
  @ApiOperation({ summary: 'Download Category-wise Customer Contacts PDF' })
  @ApiQuery({ name: 'category', required: false })
  async downloadCustomerPdf(@Query('category') category: string = 'ALL', @Res() res: Response) {
    const pdfBuffer = await this.reportsService.generateCustomerContactsPdf(category);
    const filename = `Safed_Sheri_${category}_Customer_Contacts.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
