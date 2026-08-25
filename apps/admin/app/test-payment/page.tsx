'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';

export default function TestPaymentPage() {
  const [amount, setAmount] = useState(1); // ₹1
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [resultData, setResultData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTestCheckout = async () => {
    setLoading(true);
    setStatus('processing');
    setErrorMessage(null);
    setResultData(null);

    try {
      // 1. Create order on backend
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // paise
          currency: 'INR',
          receipt: `test_rcpt_${Date.now()}`,
          notes: {
            purpose: 'Razorpay Onboarding Verification Test',
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.message || 'Failed to create Razorpay test order');
      }

      // 2. Configure Razorpay Standard Checkout modal
      const options = {
        key: orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TU3glApQtNIVtN',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Safed Sheri 2026',
        description: 'Razorpay Onboarding Integration Verification',
        order_id: orderData.order_id,
        prefill: {
          name: 'Test Customer',
          email: 'info@safedsheri.com',
          contact: '9999999999',
        },
        theme: {
          color: '#D99427',
        },
        handler: async function (response: any) {
          setLoading(true);
          try {
            // 3. Verify signature on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setStatus('success');
              setResultData({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                amount: `₹${amount}`,
              });
            } else {
              setStatus('failed');
              setErrorMessage(verifyData.message || 'Signature verification failed');
            }
          } catch (err: any) {
            setStatus('failed');
            setErrorMessage(err.message || 'Verification request failed');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            if (status !== 'success') {
              setStatus('idle');
            }
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setStatus('failed');
        setErrorMessage(resp.error?.description || 'Payment was declined or failed');
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      setStatus('failed');
      setErrorMessage(err.message || 'An error occurred during order initialization');
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-[#FDFBF7] text-[#2D1F0E] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-[#EAD9B8] shadow-xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F6C85F]/20 text-[#8C6019] text-xs font-bold uppercase tracking-wider">
              <span>Razorpay Integration Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D1F0E]">
              Test Transaction Checkout
            </h1>
            <p className="text-xs text-[#6E5336] max-w-sm mx-auto">
              Use this instant checkout to complete a verified test payment and pass Razorpay&apos;s onboarding test step.
            </p>
          </div>

          {/* Key details badge */}
          <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#EAD9B8] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6E5336] font-medium">Merchant Key ID:</span>
              <span className="font-mono font-bold text-[#8C6019]">rzp_test_TU3glApQtNIVtN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E5336] font-medium">Environment:</span>
              <span className="font-semibold text-emerald-700">Test Mode (Standard Checkout)</span>
            </div>
          </div>

          {/* Amount selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8C6019]">
              Test Payment Amount (INR)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 10, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                    amount === val
                      ? 'bg-[#D99427] text-white border-[#D99427] shadow-sm'
                      : 'bg-white text-[#2D1F0E] border-[#EAD9B8] hover:bg-[#FAF7F0]'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleTestCheckout}
            disabled={loading}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-sm tracking-wider uppercase hover:opacity-95 transition disabled:opacity-50 shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Opening Razorpay Modal...' : `Pay ₹${amount} with Razorpay Modal`}</span>
          </button>

          {/* Result / Success state */}
          {status === 'success' && resultData && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2 text-xs text-emerald-900 animate-fadeIn">
              <div className="flex items-center space-x-2 font-bold text-emerald-800 text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                <span>Test Payment Verified & Captured!</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                This transaction was confirmed by HMAC-SHA256 signature verification. You can now go to your Razorpay Dashboard and click <strong>&quot;I have done the transaction&quot;</strong>.
              </p>
              <div className="pt-2 border-t border-emerald-200 font-mono text-[11px] space-y-1 text-emerald-800">
                <div>Payment ID: <strong>{resultData.paymentId}</strong></div>
                <div>Order ID: <strong>{resultData.orderId}</strong></div>
                <div>Amount: <strong>{resultData.amount}</strong></div>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'failed' && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl space-y-1 text-xs text-rose-900">
              <div className="font-bold text-rose-800 flex items-center space-x-1">
                <span>⚠ Payment Failed</span>
              </div>
              <p className="text-[11px] text-rose-700">{errorMessage || 'Transaction could not be completed'}</p>
            </div>
          )}

          {/* Back links */}
          <div className="flex justify-between items-center text-xs pt-2 border-t border-[#EAD9B8]">
            <Link href="/" className="text-[#8C6019] hover:underline font-medium">
              ← Back to Safed Sheri Home
            </Link>
            <Link href="/admin" className="text-[#8C6019] hover:underline font-medium">
              Admin Portal →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
