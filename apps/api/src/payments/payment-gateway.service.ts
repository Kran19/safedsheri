import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

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
  private readonly providerName = 'RAZORPAY';
  private razorpayInstance: any;

  constructor() {
    this.razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_S7dlJIqMvrpcaj',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'ongR1rNVsrzSoVyjGx6VY9Zm',
    });
  }

  async createPaymentOrder(req: PaymentOrderRequest): Promise<PaymentOrderResponse> {
    const paymentLinkId = `paylink_${crypto.randomBytes(16).toString('hex')}`;
    
    const options = {
      amount: Math.round(req.amount * 100), // paise
      currency: "INR",
      receipt: req.registrationNumber,
      notes: {
        registrationId: req.registrationId,
        customerName: req.customerName,
        customerPhone: req.customerPhone,
      }
    };

    const order = await this.razorpayInstance.orders.create(options);

    return {
      paymentLinkId,
      providerReference: order.id,
      amount: req.amount,
      razorpayOrderId: order.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_S7dlJIqMvrpcaj',
    };
  }

  getProviderName(): string {
    return this.providerName;
  }
}
