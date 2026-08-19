'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest, getAuthToken, getStoredUser } from '../../lib/api';
import { 
  Search, QrCode, Send, CheckCircle2, AlertCircle, RefreshCw, Lock, Sparkles, 
  Smartphone, PlusCircle, History, DollarSign, CreditCard, Users, Printer, FileText
} from 'lucide-react';
import LogoSlot from '../components/LogoSlot';
import { AdvancedTabulatorTable, TabulatorColumn } from '../components/AdvancedTabulatorTable';

export default function CashierDeskTerminal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'analytics' | 'manual' | 'lookup'>('analytics');

  // Stats & Ledger State
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Dynamic Lookup State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundReg, setFoundReg] = useState<any>(null);
  const [upiQrData, setUpiQrData] = useState<any>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [dispatchingWa, setDispatchingWa] = useState(false);
  const [simulatingConfirm, setSimulatingConfirm] = useState(false);

  // Manual On-Spot Form State
  const [manualForm, setManualForm] = useState({
    passType: 'SINGLE' as 'SINGLE' | 'COUPLE' | 'GAZEBO',
    customAmount: 3500,
    paymentMethod: 'UPI_QR' as 'UPI_QR' | 'ONLINE_GATEWAY' | 'CUSTOM_DIRECT',
    notes: 'On-spot walk-in booking by Desk Executive',
    att1Name: '',
    att1Phone: '',
    att1Email: '',
    att1Gender: 'FEMALE' as 'FEMALE' | 'MALE',
    att1Aadhaar: '',
    att2Name: '',
    att2Phone: '',
    att2Email: '',
    att2Gender: 'MALE' as 'FEMALE' | 'MALE',
    att2Aadhaar: '',
  });
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccessResult, setManualSuccessResult] = useState<any>(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    if (!token || !user) {
      setIsAuthenticated(false);
      return;
    }
    setIsAuthenticated(true);
    loadFinancialData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
        loadFinancialData(true);
      }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  async function loadFinancialData(silent = false) {
    if (!silent) setLoadingLedger(true);
    setError('');
    const resStats = await apiRequest('/payments/stats');
    if (resStats.success) {
      setStats(resStats.data);
    } else if (resStats.error?.code === 'UNAUTHORIZED') {
      setIsAuthenticated(false);
      setLoadingLedger(false);
      return;
    }

    const resTx = await apiRequest('/payments');
    if (resTx.success) {
      setTransactions(resTx.data || []);
    }
    if (!silent) setLoadingLedger(false);
  }

  async function handleSearchReg(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setFoundReg(null);
    setUpiQrData(null);
    setError('');
    setMessage('');

    const res = await apiRequest(`/registrations?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearching(false);

    if (res.success && res.data && res.data.length > 0) {
      const reg = res.data[0];
      setFoundReg(reg);
      if (reg.status === 'PAYMENT_PENDING' || reg.status === 'APPROVED') {
        loadDynamicUpiQr(reg.id);
      }
    } else {
      setError(`No application found matching "${searchQuery}".`);
    }
  }

  async function loadDynamicUpiQr(registrationId: string) {
    setGeneratingQr(true);
    const res = await apiRequest('/payments/upi-qr-generate', {
      method: 'POST',
      body: JSON.stringify({ registrationId }),
    });
    setGeneratingQr(false);

    if (res.success && res.data) {
      setUpiQrData(res.data);
    }
  }

  async function handleSendWhatsAppLink() {
    if (!foundReg) return;
    setDispatchingWa(true);
    setError('');

    const res = await apiRequest('/payments/send-whatsapp-link', {
      method: 'POST',
      body: JSON.stringify({ registrationId: foundReg.id }),
    });
    setDispatchingWa(false);

    if (res.success) {
      setMessage(res.message || 'WhatsApp online payment link dispatched successfully!');
    } else {
      setError(res.error?.message || 'Failed to dispatch WhatsApp payment link');
    }
  }

  async function handleSimulateGatewayPayment() {
    if (!upiQrData?.paymentLinkId) return;
    setSimulatingConfirm(true);
    setError('');

    const res = await apiRequest('/payments/gateway-confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentLinkId: upiQrData.paymentLinkId,
        providerReference: `UPI-ONLINE-${Date.now().toString().slice(-6)}`,
        notes: 'Candidate completed online UPI payment via desk dynamic QR',
      }),
    });

    setSimulatingConfirm(false);

    if (res.success && res.data) {
      setMessage(`Online payment confirmed! Pass issued with receipt #${res.data.receiptNumber}`);
      loadFinancialData();
      handleSearchReg();
    } else {
      setError(res.error?.message || 'Online payment confirmation failed');
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingManual(true);
    setError('');
    setMessage('');
    setManualSuccessResult(null);

    const attendees: any[] = [
      {
        fullName: manualForm.att1Name,
        phone: manualForm.att1Phone.startsWith('+91') ? manualForm.att1Phone : `+91${manualForm.att1Phone.replace(/\D/g, '')}`,
        email: manualForm.att1Email || undefined,
        gender: manualForm.att1Gender,
        aadhaarNumber: manualForm.att1Aadhaar.replace(/\D/g, ''),
      },
    ];

    if (manualForm.passType === 'COUPLE') {
      if (!manualForm.att2Name || !manualForm.att2Phone || !manualForm.att2Aadhaar) {
        setError('Attendee #2 details are required for Couple Pass.');
        setSubmittingManual(false);
        return;
      }
      attendees.push({
        fullName: manualForm.att2Name,
        phone: manualForm.att2Phone.startsWith('+91') ? manualForm.att2Phone : `+91${manualForm.att2Phone.replace(/\D/g, '')}`,
        email: manualForm.att2Email || undefined,
        gender: manualForm.att2Gender,
        aadhaarNumber: manualForm.att2Aadhaar.replace(/\D/g, ''),
      });
    }

    const res = await apiRequest('/payments/manual-entry', {
      method: 'POST',
      body: JSON.stringify({
        passType: manualForm.passType,
        customAmount: Number(manualForm.customAmount),
        paymentMethod: manualForm.paymentMethod,
        attendees,
        notes: manualForm.notes,
      }),
    });

    setSubmittingManual(false);

    if (res.success && res.data) {
      setManualSuccessResult(res.data);
      setMessage(res.message || 'Manual entry created and passes issued!');
      loadFinancialData();
    } else {
      setError(res.error?.message || 'Failed to create manual entry');
    }
  }

  // =========================================================================
  // CASHIER TABULATOR COLUMNS
  // =========================================================================
  const cashierColumns: TabulatorColumn<any>[] = [
    {
      key: 'receiptNumber',
      title: 'Receipt #',
      sortable: true,
      render: (r) => <strong className="font-mono text-[#2D1F0E]">{r.receiptNumber}</strong>,
    },
    {
      key: 'registrationNumber',
      title: 'Application #',
      sortable: true,
      getValue: (r) => r.registration?.registrationNumber || '',
      render: (r) => <span className="font-mono">{r.registration?.registrationNumber || '—'}</span>,
    },
    {
      key: 'attendeeName',
      title: 'Primary Attendee',
      sortable: true,
      getValue: (r) => r.registration?.attendees?.[0]?.attendee?.fullName || '',
      render: (r) => {
        const att = r.registration?.attendees?.[0]?.attendee;
        return (
          <div>
            <div className="font-semibold text-[#2D1F0E]">{att?.fullName || '—'}</div>
            <div className="text-[10px] text-[#6E5336] font-mono">{att?.phone}</div>
          </div>
        );
      },
    },
    {
      key: 'method',
      title: 'Payment Method',
      sortable: true,
      render: (r) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          r.method === 'UPI_QR'
            ? 'bg-amber-100 text-amber-800'
            : r.method === 'ONLINE_GATEWAY'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-purple-100 text-purple-800'
        }`}>
          {r.method}
        </span>
      ),
    },
    {
      key: 'amount',
      title: 'Amount (₹)',
      sortable: true,
      isNumeric: true,
      align: 'right',
      getValue: (r) => Number(r.amount || 0),
      render: (r) => (
        <span className="font-serif font-bold text-emerald-800 text-sm">
          ₹{Number(r.amount)?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'providerReference',
      title: 'TXN Reference',
      sortable: true,
      render: (r) => <span className="font-mono text-[11px] text-[#6E5336]">{r.providerReference || '—'}</span>,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (r) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
          {r.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Settled At',
      sortable: true,
      getValue: (r) => new Date(r.createdAt).toISOString(),
      render: (r) => (
        <span className="text-[#6E5336] font-mono text-[11px]">
          {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-white text-[#2D1F0E] flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-white border-2 border-[#EAD9B8] rounded-3xl p-8 shadow-xl text-center space-y-5">
          <LogoSlot className="justify-center mx-auto" />
          <div className="w-16 h-16 rounded-full bg-[#FFF5DC] border border-[#E5A93C] flex items-center justify-center mx-auto text-[#8C6019]">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-[#2D1F0E]">FINANCE DESK LOGIN REQUIRED</h2>
            <p className="text-xs text-[#6E5336] mt-2">
              Sign in with Ticketing / Finance credentials to access cashier terminal.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
          >
            Go to Staff Login Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in text-[#2D1F0E] pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAD9B8] pb-6">
        <div className="flex items-center space-x-4">
          <LogoSlot size="md" />
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#FFF5DC] border border-[#E5A93C] mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D99427] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-wider">
                BOX OFFICE DESK & TABULATOR SUITE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F0E]">
              Cashier & Collection Hub
            </h1>
            <p className="text-xs text-[#6E5336]">
              Real-time Analytics • Tabulator Excel & CSV Export • On-Spot Free-Hand Entry • Dynamic UPI Assist
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadFinancialData()}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8F5EE] border border-[#EAD9B8] text-xs font-bold text-[#2D1F0E] flex items-center space-x-2 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#D99427]" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FFF5DC] to-[#FAF6EE] border-2 border-[#D99427] shadow-sm">
          <div className="text-[11px] font-bold text-[#8C6019] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Collection</span>
            <DollarSign className="w-4 h-4 text-[#D99427]" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F0E]">
            ₹{stats?.totalVolume?.toLocaleString() || '0'}
          </div>
          <div className="text-[10px] text-[#6E5336] mt-1 font-mono">
            {stats?.totalTransactions || 0} Total Receipts Issued
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#EAD9B8] shadow-sm">
          <div className="text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Today&apos;s Revenue</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-emerald-950">
            ₹{stats?.todayVolume?.toLocaleString() || '0'}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-mono">Active Settlement</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#EAD9B8] shadow-sm">
          <div className="text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>UPI & Gateway</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl md:text-2xl font-serif font-bold text-blue-950">
            ₹{((stats?.methodBreakdown?.UPI_QR || 0) + (stats?.methodBreakdown?.ONLINE_GATEWAY || 0)).toLocaleString()}
          </div>
          <div className="text-[10px] text-[#6E5336] mt-1 font-mono">Digital Settlements</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#EAD9B8] shadow-sm">
          <div className="text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Direct Counter</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl md:text-2xl font-serif font-bold text-purple-950">
            ₹{(stats?.methodBreakdown?.CUSTOM_DIRECT || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-[#6E5336] mt-1 font-mono">Walk-in Settlements</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-[#EAD9B8] space-x-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl transition ${
            activeTab === 'analytics'
              ? 'bg-[#2D1F0E] text-white font-bold shadow-md'
              : 'text-[#6E5336] hover:bg-[#F8F5EE] hover:text-[#2D1F0E]'
          }`}
        >
          <History className="w-4 h-4 text-[#D99427]" />
          <span>Transactions Tabulator & Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl transition ${
            activeTab === 'manual'
              ? 'bg-[#2D1F0E] text-white font-bold shadow-md'
              : 'text-[#6E5336] hover:bg-[#F8F5EE] hover:text-[#2D1F0E]'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-[#D99427]" />
          <span>Manual On-Spot Booking (Free-Hand)</span>
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl transition ${
            activeTab === 'lookup'
              ? 'bg-[#2D1F0E] text-white font-bold shadow-md'
              : 'text-[#6E5336] hover:bg-[#F8F5EE] hover:text-[#2D1F0E]'
          }`}
        >
          <QrCode className="w-4 h-4 text-[#D99427]" />
          <span>Dynamic UPI QR & WhatsApp Assist</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ADVANCED TABULATOR TRANSACTIONS LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <AdvancedTabulatorTable
          data={transactions}
          columns={cashierColumns}
          keyField="id"
          title="Box Office Transaction Ledger"
          subtitle="Real-time Financial Ledger • One-Click Excel (.xlsx), CSV, Print & TSV Copy"
          defaultPageSize={10}
          onRefresh={() => loadFinancialData()}
          isLoading={loadingLedger}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANUAL ON-SPOT BOOKING (FREE-HAND MODE) */}
      {/* ========================================================================= */}
      {activeTab === 'manual' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-[#EAD9B8] shadow-xl space-y-6">
          <div>
            <div className="inline-block text-[10px] font-mono tracking-widest font-bold text-[#8C6019] uppercase mb-1">
              FREE-HAND DESK REGISTRATION & INSTANT MINTING
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">On-Spot Manual Attendee Entry</h3>
            <p className="text-xs text-[#6E5336] mt-1">
              Create a custom attendee pass with full free-hand amount override, payment method selection, and immediate pass minting.
            </p>
          </div>

          {!manualSuccessResult ? (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              {/* PASS CONFIGURATION */}
              <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Pass Category *</label>
                  <select
                    value={manualForm.passType}
                    onChange={(e) => {
                      const pt = e.target.value as any;
                      setManualForm({
                        ...manualForm,
                        passType: pt,
                        customAmount: pt === 'SINGLE' ? 3500 : pt === 'COUPLE' ? 6500 : 85000,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs font-semibold focus:border-[#D99427] outline-none"
                  >
                    <option value="SINGLE">Single Pass (Female)</option>
                    <option value="COUPLE">Couple Pass (2 Guests)</option>
                    <option value="GAZEBO">Gazebo VIP Lounge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Settlement Amount (₹ Free-Hand) *</label>
                  <input
                    type="number"
                    required
                    value={manualForm.customAmount}
                    onChange={(e) => setManualForm({ ...manualForm, customAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs font-serif font-bold text-emerald-800 focus:border-[#D99427] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Payment Method *</label>
                  <select
                    value={manualForm.paymentMethod}
                    onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs font-semibold focus:border-[#D99427] outline-none"
                  >
                    <option value="UPI_QR">UPI Dynamic QR</option>
                    <option value="ONLINE_GATEWAY">Online Gateway / Link</option>
                    <option value="CUSTOM_DIRECT">Custom Direct / POS Settlement</option>
                  </select>
                </div>
              </div>

              {/* ATTENDEE 1 */}
              <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#EAD9B8] space-y-4">
                <div className="text-xs font-bold text-[#2D1F0E] uppercase border-b border-[#EAD9B8] pb-2">
                  Attendee #1 (Primary Guest)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Name on ID"
                      value={manualForm.att1Name}
                      onChange={(e) => setManualForm({ ...manualForm, att1Name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">WhatsApp Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={manualForm.att1Phone}
                      onChange={(e) => setManualForm({ ...manualForm, att1Phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Gender *</label>
                    <select
                      value={manualForm.att1Gender}
                      onChange={(e) => setManualForm({ ...manualForm, att1Gender: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                    >
                      <option value="FEMALE">Female</option>
                      {manualForm.passType !== 'SINGLE' && <option value="MALE">Male</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">12-Digit Aadhaar *</label>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      placeholder="XXXXXXXXXXXX"
                      value={manualForm.att1Aadhaar}
                      onChange={(e) => setManualForm({ ...manualForm, att1Aadhaar: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs font-mono focus:border-[#D99427] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ATTENDEE 2 (IF COUPLE) */}
              {manualForm.passType === 'COUPLE' && (
                <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#EAD9B8] space-y-4">
                  <div className="text-xs font-bold text-[#2D1F0E] uppercase border-b border-[#EAD9B8] pb-2">
                    Attendee #2 (Accompanying Guest)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Name on ID"
                        value={manualForm.att2Name}
                        onChange={(e) => setManualForm({ ...manualForm, att2Name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">WhatsApp Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={manualForm.att2Phone}
                        onChange={(e) => setManualForm({ ...manualForm, att2Phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Gender *</label>
                      <select
                        value={manualForm.att2Gender}
                        onChange={(e) => setManualForm({ ...manualForm, att2Gender: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">12-Digit Aadhaar *</label>
                      <input
                        type="text"
                        required
                        maxLength={14}
                        placeholder="XXXXXXXXXXXX"
                        value={manualForm.att2Aadhaar}
                        onChange={(e) => setManualForm({ ...manualForm, att2Aadhaar: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs font-mono focus:border-[#D99427] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Custom Notes / Desk Reason</label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs uppercase tracking-widest hover:opacity-95 transition shadow-lg shadow-[#D99427]/25 disabled:opacity-50"
                >
                  {submittingManual ? 'Issuing Passes...' : 'Confirm Settlement & Mint Passes (₹' + Number(manualForm.customAmount).toLocaleString() + ')'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center text-2xl mx-auto font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">
                  Manual Entry & Passes Minted!
                </h3>
                <p className="text-xs text-[#6E5336] mt-1 font-mono">
                  Receipt #{manualSuccessResult.payment?.receiptNumber} • Application #{manualSuccessResult.registration?.registrationNumber}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-left max-w-lg mx-auto space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6E5336]">Amount Settled:</span>
                  <span className="font-bold text-emerald-800 font-serif">₹{Number(manualSuccessResult.payment?.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E5336]">Payment Method:</span>
                  <span className="font-bold">{manualSuccessResult.payment?.method}</span>
                </div>
                <div className="flex justify-between border-t border-[#EAD9B8] pt-2">
                  <span className="text-[#6E5336]">Issued Passes:</span>
                  <span className="font-bold text-[#D99427]">{manualSuccessResult.credentials?.length} Active Digital Pass(es)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setManualSuccessResult(null);
                  setActiveTab('analytics');
                }}
                className="px-6 py-2.5 rounded-full bg-[#2D1F0E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#4A351B] transition shadow-md"
              >
                Back to Ledger
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DYNAMIC UPI QR & WHATSAPP ASSIST */}
      {/* ========================================================================= */}
      {activeTab === 'lookup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#EAD9B8] shadow-md space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#2D1F0E] uppercase tracking-wider">
              Lookup Application for Dynamic UPI QR & Payment Assistance
            </h3>
            <form onSubmit={handleSearchReg} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Search by SS-2026-XXXXXX number, phone, or attendee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none font-mono"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition disabled:opacity-50 shadow-md flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>{searching ? 'Searching...' : 'Search'}</span>
              </button>
            </form>
          </div>

          {foundReg && (
            <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-[#EAD9B8] shadow-xl space-y-6">
              <div className="flex justify-between items-start border-b border-[#EAD9B8] pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-wider block">
                    {foundReg.passType} PASS
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#2D1F0E]">{foundReg.registrationNumber}</h3>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    foundReg.status === 'PASS_ISSUED' || foundReg.status === 'PAYMENT_CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : foundReg.status === 'PAYMENT_PENDING' || foundReg.status === 'APPROVED'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {foundReg.status}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-bold text-[#2D1F0E]">Attendees:</div>
                    {foundReg.attendees?.map((a: any, idx: number) => (
                      <div key={idx} className="mt-1 text-[#6E5336]">
                        • <strong>{a.attendee?.fullName}</strong> ({a.attendee?.gender}) — {a.attendee?.phone}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-[#2D1F0E]">Amount Due:</div>
                    <div className="text-3xl font-serif font-bold text-[#D99427] mt-1">
                      ₹{Number(foundReg.amountDue)?.toLocaleString()}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSendWhatsAppLink}
                      disabled={dispatchingWa}
                      className="px-5 py-2.5 rounded-full bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] font-bold text-xs flex items-center space-x-2 transition shadow-sm"
                    >
                      <Smartphone className="w-4 h-4 text-[#D99427]" />
                      <span>{dispatchingWa ? 'Dispatching...' : 'Dispatch WhatsApp Payment Link'}</span>
                    </button>
                  </div>
                </div>

                {foundReg.status !== 'PASS_ISSUED' && foundReg.status !== 'PAYMENT_CONFIRMED' ? (
                  <div className="p-6 rounded-2xl bg-[#FFFDF9] border border-[#EAD9B8] text-center space-y-3 shadow-md">
                    <div className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-wider">
                      DYNAMIC COUNTER UPI QR
                    </div>

                    {upiQrData ? (
                      <>
                        <div className="flex justify-center p-2 bg-white rounded-xl border border-[#EAD9B8] inline-block mx-auto shadow-sm">
                          <QRCodeSVG value={upiQrData.upiQrPayload} size={150} level="M" />
                        </div>
                        <div className="text-xs font-serif font-bold text-[#2D1F0E]">
                          Amount: ₹{upiQrData.amountDue?.toLocaleString()}
                        </div>
                        <button
                          onClick={handleSimulateGatewayPayment}
                          disabled={simulatingConfirm}
                          className="w-full py-2.5 mt-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50 shadow-md"
                        >
                          {simulatingConfirm ? 'Verifying...' : 'Simulate Gateway Webhook Confirmation'}
                        </button>
                      </>
                    ) : (
                      <div className="py-8 text-xs text-[#6E5336]">
                        {generatingQr ? 'Generating Dynamic UPI QR...' : 'Application must be approved to generate QR.'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center justify-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    <div className="font-bold text-emerald-950 text-sm">Payment Confirmed</div>
                    <div className="text-xs text-emerald-800">Passes have been issued to the candidate wallet.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
