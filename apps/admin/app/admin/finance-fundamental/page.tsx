'use client';

import React, { useEffect, useState } from 'react';
import { getAuthToken } from '../../../lib/api';
import { Banknote, CreditCard, QrCode, Search, RefreshCw, Eye } from 'lucide-react';

export default function FinanceFundamentalPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token');
      
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_BASE}/payments/finance-fundamental`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        throw new Error(json.message || 'Failed to fetch stats');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-xl border border-red-200">
        <h3 className="text-xl font-bold">Error</h3>
        <p>{error}</p>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#2D2319]">Finance Fundamental</h1>
          <p className="text-sm text-amber-800 mt-1 font-mono">Accurate breakdown separating Actual Razorpay, Manual Admin QR, and Cash.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-50 shadow-sm transition-colors text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Stats
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cash Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-sm relative overflow-hidden group hover:border-green-400 transition-colors">
          <div className="absolute -right-6 -top-6 bg-green-50 w-32 h-32 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform">
            <Banknote className="w-12 h-12 text-green-600 opacity-20" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Banknote className="w-4 h-4" /> Total Cash
            </h3>
            <p className="text-4xl font-serif font-bold text-green-950">
              ₹{(stats?.totalCash || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-green-700 mt-2 font-mono">Amount collected via Cash desk.</p>
          </div>
        </div>

        {/* Razorpay Actual Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-colors">
          <div className="absolute -right-6 -top-6 bg-blue-50 w-32 h-32 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform">
            <CreditCard className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Razorpay Actual
            </h3>
            <p className="text-4xl font-serif font-bold text-blue-950">
              ₹{(stats?.totalRazorpayActual || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-blue-700 mt-2 font-mono">True online payments via Razorpay.</p>
          </div>
        </div>

        {/* Admin Manual QR Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-purple-200 shadow-sm relative overflow-hidden group hover:border-purple-400 transition-colors">
          <div className="absolute -right-6 -top-6 bg-purple-50 w-32 h-32 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform">
            <QrCode className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Admin Manual (QR)
            </h3>
            <p className="text-4xl font-serif font-bold text-purple-950">
              ₹{(stats?.totalAdminManualQr || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-purple-700 mt-2 font-mono">Online passes overridden manually by Admin.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-amber-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50/30">
          <h2 className="text-lg font-bold text-[#2D2319] flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-700" />
            Recent Transactions Log
          </h2>
          <span className="text-xs font-mono text-amber-700 bg-amber-100 px-3 py-1 rounded-full font-bold">
            Showing latest 100
          </span>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#FAF6EE] sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="p-4 font-bold text-amber-900 border-b border-amber-200">Date & Time</th>
                <th className="p-4 font-bold text-amber-900 border-b border-amber-200">Registration #</th>
                <th className="p-4 font-bold text-amber-900 border-b border-amber-200">Attendee Name</th>
                <th className="p-4 font-bold text-amber-900 border-b border-amber-200">Amount</th>
                <th className="p-4 font-bold text-amber-900 border-b border-amber-200">Method</th>
                <th className="p-4 font-bold text-amber-900 border-b border-amber-200">Status</th>
                <th className="p-4 font-bold text-amber-900 border-b border-amber-200">Processed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/50">
              {stats?.recentTransactions?.map((tx: any) => {
                const attendeeName = tx.registration?.attendees?.[0]?.attendee?.fullName || 'N/A';
                const isManualOnline = tx.method === 'ONLINE_GATEWAY' && tx.providerReference?.startsWith('ADMIN-MANUAL');
                const methodLabel = isManualOnline ? 'ONLINE (MANUAL)' : tx.method;
                
                return (
                  <tr key={tx.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-amber-800">
                      {new Date(tx.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 font-mono font-bold text-[#2D2319]">
                      {tx.registration?.registrationNumber || 'N/A'}
                    </td>
                    <td className="p-4 text-[#2D2319] font-medium truncate max-w-[200px]" title={attendeeName}>
                      {attendeeName}
                    </td>
                    <td className="p-4 font-serif font-bold text-green-700">
                      ₹{Number(tx.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md font-mono ${
                        tx.method === 'CASH' ? 'bg-green-100 text-green-800' :
                        isManualOnline ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {methodLabel}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                        tx.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-amber-900">
                      {tx.collectedBy?.fullName ? (
                        <div className="flex flex-col">
                          <span className="font-semibold">{tx.collectedBy.fullName}</span>
                          <span className="text-[9px] font-mono opacity-70">{tx.collectedBy.role}</span>
                        </div>
                      ) : (
                        <span className="opacity-50 italic">System / Gateway</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-amber-700 font-mono italic">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
