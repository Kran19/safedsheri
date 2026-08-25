import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const rawApiTarget = process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000/api/v1';
    const API_TARGET = rawApiTarget.replace('localhost', '127.0.0.1');

    const body = await req.json().catch(() => ({}));

    if (!body.razorpay_payment_id || !body.razorpay_order_id || !body.razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_TARGET}/payments/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Failed to verify payment: ${err.message}` },
      { status: 500 }
    );
  }
}
