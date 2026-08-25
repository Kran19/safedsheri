import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const rawApiTarget = process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000/api/v1';
    const API_TARGET = rawApiTarget.replace('localhost', '127.0.0.1');

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount) || 100; // in paise, minimum 100 (₹1)

    const res = await fetch(`${API_TARGET}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: body.currency || 'INR',
        receipt: body.receipt,
        notes: body.notes,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Failed to create order: ${err.message}` },
      { status: 500 }
    );
  }
}
