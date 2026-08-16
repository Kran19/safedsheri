import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface PaymentOrderRequest {
  registrationId: string;
  registrationNumber: string;
  amount: number;
  customerName: string;
  customerPhone: string;
}

export interface PaymentOrderResponse {
  paymentLinkId: string;
  providerReference: string;
  amount: number;
  checkoutUrl: string;
  qrPayload: string;
  expiresAt: Date;
}

@Injectable()
export class PaymentGatewayService {
  private readonly providerName = 'SAFED_SHERI_SECURE_GATEWAY';

  async createPaymentOrder(req: PaymentOrderRequest): Promise<PaymentOrderResponse> {
    const paymentLinkId = `paylink_${crypto.randomBytes(16).toString('hex')}`;
    const providerReference = `PG-TXN-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const checkoutUrl = `/pay/${paymentLinkId}`;
    const qrPayload = `upi://pay?pa=safedsheri@icici&pn=Safed%20Sheri%202026&am=${req.amount}&tr=${providerReference}&tn=Pass%20Booking%20${req.registrationNumber}`;

    return {
      paymentLinkId,
      providerReference,
      amount: req.amount,
      checkoutUrl,
      qrPayload,
      expiresAt,
    };
  }

  getProviderName(): string {
    return this.providerName;
  }
}
