import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
const Razorpay = require('razorpay');

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
  razorpayOrderId: string;
  razorpayKeyId: string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly providerName = 'RAZORPAY';

  private getRazorpay() {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TU3glApQtNIVtN';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'QvHoIsEpEo3OiV3JjcBAoe1E';
    return new Razorpay({ key_id, key_secret });
  }

  getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || 'rzp_test_TU3glApQtNIVtN';
  }

  getKeySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET || 'QvHoIsEpEo3OiV3JjcBAoe1E';
  }

  async createPaymentOrder(req: PaymentOrderRequest): Promise<PaymentOrderResponse> {
    const paymentLinkId = `paylink_${crypto.randomBytes(16).toString('hex')}`;
    const keyId = this.getKeyId();
    const rzp = this.getRazorpay();

    const options = {
      amount: Math.round(req.amount * 100), // paise
      currency: 'INR',
      receipt: req.registrationNumber,
      notes: {
        registrationId: req.registrationId,
        customerName: req.customerName,
        customerPhone: req.customerPhone,
      },
    };

    const order = await rzp.orders.create(options);
    this.logger.log(`Created Razorpay Order ${order.id} for registration ${req.registrationNumber} (Amount: ₹${req.amount})`);

    return {
      paymentLinkId,
      providerReference: order.id,
      amount: req.amount,
      razorpayOrderId: order.id,
      razorpayKeyId: keyId,
    };
  }

  async createStandardOrder(amountInPaise: number, currency: string = 'INR', receipt?: string, notes?: any) {
    const keyId = this.getKeyId();
    const rzp = this.getRazorpay();

    const options: any = {
      amount: Math.max(100, Math.round(amountInPaise)), // Minimum 100 paise (₹1)
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await rzp.orders.create(options);
    this.logger.log(`Created Standard Razorpay Order ${order.id} (Amount: ${options.amount} paise)`);

    return {
      order_id: order.id,
      razorpayOrderId: order.id,
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt,
      key_id: keyId,
      razorpayKeyId: keyId,
    };
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = this.getKeySecret();
    const generated = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return generated === signature;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
