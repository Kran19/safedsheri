'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest, getAuthToken, getStoredUser } from '../../lib/api';
import { 
  Search, QrCode, Send, CheckCircle2, AlertCircle, RefreshCw, Lock, Sparkles, 
  Smartphone, PlusCircle, History, DollarSign, CreditCard, Users, Printer, FileText,
  Upload, Check, X, Banknote, Calendar, ShieldCheck, ArrowRight
} from 'lucide-react';
import LogoSlot from '../components/LogoSlot';
import { AdvancedTabulatorTable, TabulatorColumn } from '../components/AdvancedTabulatorTable';
import { PremiumDatePicker } from '../components/PremiumDatePicker';

interface CashierAttendee {
  fullName: string;
  phone: string;
  email: string;
  gender: 'FEMALE' | 'MALE';
  aadhaarNumber: string;
  dob: string;
  age?: number | null;
  kidsAgeGroup?: string;
  documentFrontKey?: string;
  documentFrontName?: string;
  documentBackKey?: string;
  documentBackName?: string;
  isUploadingFront?: boolean;
  isUploadingBack?: boolean;
  uploadError?: string;
}

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
    passType: 'SINGLE' as 'SINGLE' | 'COUPLE' | 'KIDS' | 'GAZEBO',
    customAmount: 3500,
    paymentMethod: 'CUSTOM_DIRECT' as 'CUSTOM_DIRECT' | 'UPI_QR',
    notes: 'On-spot walk-in booking by Desk Executive',
  });

  const [cashierAttendees, setCashierAttendees] = useState<CashierAttendee[]>([
    {
      fullName: '',
      phone: '',
      email: '',
      gender: 'FEMALE',
      aadhaarNumber: '',
      dob: '',
      age: null,
    }
  ]);

  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccessResult, setManualSuccessResult] = useState<any>(null);
  const [activeQrModal, setActiveQrModal] = useState<any>(null);

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

  // Handle Pass Type Switch
  function handlePassTypeChange(newType: 'SINGLE' | 'COUPLE' | 'KIDS' | 'GAZEBO') {
    let defaultAmount = 3500;
    if (newType === 'SINGLE') defaultAmount = 3500;
    if (newType === 'COUPLE') defaultAmount = 6500;
    if (newType === 'KIDS') defaultAmount = 0;
    if (newType === 'GAZEBO') defaultAmount = 85000;

    let newAttendees: CashierAttendee[] = [];
    if (newType === 'COUPLE') {
      newAttendees = [
        { fullName: '', phone: '', email: '', gender: 'FEMALE', aadhaarNumber: '', dob: '', age: null },
        { fullName: '', phone: '', email: '', gender: 'MALE', aadhaarNumber: '', dob: '', age: null },
      ];
    } else if (newType === 'KIDS') {
      newAttendees = [
        { fullName: '', phone: '', email: '', gender: 'FEMALE', aadhaarNumber: '', dob: '', age: null, kidsAgeGroup: 'UNDER_10' },
      ];
    } else {
      newAttendees = [
        { fullName: '', phone: '', email: '', gender: 'FEMALE', aadhaarNumber: '', dob: '', age: null },
      ];
    }

    setManualForm({
      ...manualForm,
      passType: newType,
      customAmount: defaultAmount,
    });
    setCashierAttendees(newAttendees);
  }

  // Update specific attendee field
  function updateCashierAttendee(index: number, field: keyof CashierAttendee, value: any) {
    setCashierAttendees(prev => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      copy[index] = { ...copy[index], [field]: value };

      // If updating DOB on Kids pass, recalculate age & price
      if (manualForm.passType === 'KIDS' && field === 'dob' && value) {
        const [y, m, d] = value.split('-').map(Number);
        const dobDate = new Date(y, m - 1, d);
        if (!isNaN(dobDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - dobDate.getFullYear();
          const mDiff = today.getMonth() - dobDate.getMonth();
          if (mDiff < 0 || (mDiff === 0 && today.getDate() < dobDate.getDate())) age--;
          copy[index].age = age;
          if (age <= 10) {
            copy[index].kidsAgeGroup = 'UNDER_10';
            setManualForm(mf => ({ ...mf, customAmount: 0 }));
          } else if (age > 10 && age <= 15) {
            copy[index].kidsAgeGroup = 'AGE_11_15';
            setManualForm(mf => ({ ...mf, customAmount: 1200 }));
          }
        }
      }
      return copy;
    });
  }

  // OCR Upload for Cashier
  async function handleAadhaarUpload(index: number, side: 'front' | 'back', file: File) {
    if (!file) return;
    setCashierAttendees(prev => {
      const copy = [...prev];
      if (side === 'front') copy[index].isUploadingFront = true;
      if (side === 'back') copy[index].isUploadingBack = true;
      copy[index].uploadError = undefined;
      return copy;
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('side', side);

      const res = await fetch(`/api/v1/uploads/aadhaar/extract`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      setCashierAttendees(prev => {
        const copy = [...prev];
        if (side === 'front') {
          copy[index].isUploadingFront = false;
          if (json.success && json.data) {
            copy[index].documentFrontKey = json.data.storageKey || json.data.id || file.name;
            copy[index].documentFrontName = file.name;
          }
          if (json.extractedData) {
            const ex = json.extractedData;
            if (ex.name) copy[index].fullName = ex.name;
            if (ex.aadhaarNumber) copy[index].aadhaarNumber = ex.aadhaarNumber;
            if (ex.gender) copy[index].gender = ex.gender === 'MALE' ? 'MALE' : 'FEMALE';
            if (ex.dob) {
              copy[index].dob = ex.dob;
              if (ex.age !== undefined && ex.age !== null) {
                copy[index].age = ex.age;
                if (manualForm.passType === 'KIDS') {
                  if (ex.age <= 10) {
                    copy[index].kidsAgeGroup = 'UNDER_10';
                    setManualForm(mf => ({ ...mf, customAmount: 0 }));
                  } else if (ex.age > 10 && ex.age <= 15) {
                    copy[index].kidsAgeGroup = 'AGE_11_15';
                    setManualForm(mf => ({ ...mf, customAmount: 1200 }));
                  }
                }
              }
            }
          }
        } else if (side === 'back') {
          copy[index].isUploadingBack = false;
          if (json.success && json.data) {
            copy[index].documentBackKey = json.data.storageKeyBack || json.data.id || file.name;
            copy[index].documentBackName = file.name;
          }
        }
        return copy;
      });
    } catch (err: any) {
      setCashierAttendees(prev => {
        const copy = [...prev];
        if (side === 'front') copy[index].isUploadingFront = false;
        if (side === 'back') copy[index].isUploadingBack = false;
        copy[index].uploadError = 'Failed to extract Aadhaar data. Please fill details manually.';
        return copy;
      });
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingManual(true);
    setError('');
    setMessage('');
    setManualSuccessResult(null);

    // Validate inputs
    for (let i = 0; i < cashierAttendees.length; i++) {
      const att = cashierAttendees[i];
      if (!att.fullName || att.fullName.trim().length < 2) {
        setError(`Attendee #${i + 1} Name is required.`);
        setSubmittingManual(false);
        return;
      }
      if (manualForm.passType === 'KIDS') {
        if (!att.dob) {
          setError('Child Date of Birth is required for Kids pass.');
          setSubmittingManual(false);
          return;
        }
        if (att.age && att.age > 15) {
          setError(`Child age is ${att.age} years. Kids pass is strictly for children aged 15 and below.`);
          setSubmittingManual(false);
          return;
        }
      }
    }

    if (manualForm.passType === 'COUPLE') {
      if (cashierAttendees.length !== 2) {
        setError('Couple Pass requires 2 attendees.');
        setSubmittingManual(false);
        return;
      }
      const femaleCount = cashierAttendees.filter(a => a.gender === 'FEMALE').length;
      const maleCount = cashierAttendees.filter(a => a.gender === 'MALE').length;
      if (femaleCount !== 1 || maleCount !== 1) {
        setError('Couple Pass strictly requires 1 Female and 1 Male guest.');
        setSubmittingManual(false);
        return;
      }
    }

    const payloadAttendees = cashierAttendees.map((att) => ({
      fullName: att.fullName,
      phone: att.phone ? (att.phone.startsWith('+91') ? att.phone : `+91${att.phone.replace(/\D/g, '')}`) : `+9199999${Date.now().toString().slice(-5)}`,
      email: att.email || undefined,
      gender: att.gender,
      aadhaarNumber: att.aadhaarNumber ? att.aadhaarNumber.replace(/\D/g, '') : `9999${Date.now().toString().slice(-8)}`,
      dob: att.dob || undefined,
      kidsAgeGroup: att.kidsAgeGroup || undefined,
      documentFrontKey: att.documentFrontKey || undefined,
      documentBackKey: att.documentBackKey || undefined,
    }));

    const res = await apiRequest('/payments/manual-entry', {
      method: 'POST',
      body: JSON.stringify({
        passType: manualForm.passType,
        customAmount: Number(manualForm.customAmount),
        paymentMethod: manualForm.paymentMethod,
        attendees: payloadAttendees,
        notes: manualForm.notes,
      }),
    });

    setSubmittingManual(false);

    if (res.success && res.data) {
      if (manualForm.paymentMethod === 'UPI_QR') {
        const amountDue = Number(manualForm.customAmount);
        const upiPayload = `upi://pay?pa=safedsheri@icici&pn=Safed%20Sheri%202026&am=${amountDue}&tn=SS26-${res.data.registration?.registrationNumber}&tr=${res.data.registration?.paymentLinkId}`;
        setActiveQrModal({
          registration: res.data.registration,
          payment: res.data.payment,
          credentials: res.data.credentials,
          amountDue,
          upiPayload,
        });
      } else {
        setManualSuccessResult(res.data);
      }
      setMessage(res.message || 'Manual entry created and passes issued!');
      loadFinancialData();
    } else {
      setError(res.error?.message || 'Failed to create manual entry');
    }
  }

  // Lookup application
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
    setMessage('');

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
            : 'bg-emerald-100 text-emerald-800'
        }`}>
          {r.method === 'CUSTOM_DIRECT' ? '💵 CASH' : r.method === 'UPI_QR' ? '📱 UPI QR' : r.method}
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
                BOX OFFICE DESK & CASHIER PORTAL
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F0E]">
              Cashier & Collection Hub
            </h1>
            <p className="text-xs text-[#6E5336]">
              Aadhaar-First AI Auto-Fill • Cash & Razorpay UPI QR Settlement • Immediate Pass Minting
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

      {/* NOTIFICATIONS */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
          <button onClick={() => setMessage('')}><X className="w-4 h-4 text-emerald-700" /></button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-red-700" /></button>
        </div>
      )}

      {/* STATS OVERVIEW */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#EAD9B8] shadow-sm">
            <div className="text-[10px] font-mono font-bold text-[#8C6019] uppercase">TOTAL COLLECTION</div>
            <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">
              ₹{Number(stats.totalCollection || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#6E5336] mt-0.5">{stats.totalTransactions || 0} Successful Txns</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#EAD9B8] shadow-sm">
            <div className="text-[10px] font-mono font-bold text-[#8C6019] uppercase">CASH BOX OFFICE</div>
            <div className="text-2xl font-serif font-bold text-[#2D1F0E] mt-1">
              ₹{Number(stats.breakdown?.customDirectVolume || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#6E5336] mt-0.5">{stats.breakdown?.customDirectCount || 0} Cash Settlements</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#EAD9B8] shadow-sm">
            <div className="text-[10px] font-mono font-bold text-[#8C6019] uppercase">UPI / DYNAMIC QR</div>
            <div className="text-2xl font-serif font-bold text-[#D99427] mt-1">
              ₹{Number(stats.breakdown?.upiQrVolume || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#6E5336] mt-0.5">{stats.breakdown?.upiQrCount || 0} QR Settlements</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#EAD9B8] shadow-sm">
            <div className="text-[10px] font-mono font-bold text-[#8C6019] uppercase">ONLINE GATEWAY</div>
            <div className="text-2xl font-serif font-bold text-blue-900 mt-1">
              ₹{Number(stats.breakdown?.onlineGatewayVolume || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#6E5336] mt-0.5">{stats.breakdown?.onlineGatewayCount || 0} Web Orders</div>
          </div>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-[#EAD9B8] pb-1">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition ${
            activeTab === 'analytics'
              ? 'bg-[#2D1F0E] text-[#F6C85F] shadow-md'
              : 'bg-[#FAF6EE] text-[#6E5336] hover:bg-[#F3ECE0]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Financial Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition ${
            activeTab === 'manual'
              ? 'bg-[#2D1F0E] text-[#F6C85F] shadow-md'
              : 'bg-[#FAF6EE] text-[#6E5336] hover:bg-[#F3ECE0]'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>On-Spot Desk Registration</span>
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition ${
            activeTab === 'lookup'
              ? 'bg-[#2D1F0E] text-[#F6C85F] shadow-md'
              : 'bg-[#FAF6EE] text-[#6E5336] hover:bg-[#F3ECE0]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Dynamic QR Assist</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FINANCIAL LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-[#2D1F0E] uppercase tracking-wider">
              Settlement Ledger & Transactions ({transactions.length})
            </h3>
          </div>
          <AdvancedTabulatorTable
            data={transactions}
            columns={cashierColumns}
            keyField="id"
            title="Financial Settlement Ledger"
            isLoading={loadingLedger}
            onRefresh={() => loadFinancialData()}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ON-SPOT MANUAL ATTENDEE ENTRY */}
      {/* ========================================================================= */}
      {activeTab === 'manual' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-[#EAD9B8] shadow-xl space-y-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFF5DC] border border-[#E5A93C] text-[10px] font-bold text-[#8C6019] uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D99427]" />
              <span>AADHAAR-FIRST DESK REGISTRATION & INSTANT MINTING</span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">On-Spot Guest Registration</h3>
            <p className="text-xs text-[#6E5336] mt-1">
              Upload Aadhaar to auto-fill details automatically. Settle via Cash or dynamic Razorpay UPI QR and mint instant digital passes.
            </p>
          </div>

          {!manualSuccessResult ? (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              {/* PASS CATEGORY SELECTOR */}
              <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] space-y-3">
                <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider">Select Pass Category *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handlePassTypeChange('SINGLE')}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition ${
                      manualForm.passType === 'SINGLE'
                        ? 'bg-[#2D1F0E] text-[#F6C85F] border-[#2D1F0E] shadow-md'
                        : 'bg-white text-[#2D1F0E] border-[#EAD9B8] hover:border-[#D99427]'
                    }`}
                  >
                    <div className="text-base mb-1">💃</div>
                    <div>Single Pass</div>
                    <div className="text-[10px] font-normal opacity-80">(Female)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePassTypeChange('COUPLE')}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition ${
                      manualForm.passType === 'COUPLE'
                        ? 'bg-[#2D1F0E] text-[#F6C85F] border-[#2D1F0E] shadow-md'
                        : 'bg-white text-[#2D1F0E] border-[#EAD9B8] hover:border-[#D99427]'
                    }`}
                  >
                    <div className="text-base mb-1">👫</div>
                    <div>Couple Pass</div>
                    <div className="text-[10px] font-normal opacity-80">(1 Female + 1 Male)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePassTypeChange('KIDS')}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition ${
                      manualForm.passType === 'KIDS'
                        ? 'bg-[#2D1F0E] text-[#F6C85F] border-[#2D1F0E] shadow-md'
                        : 'bg-white text-[#2D1F0E] border-[#EAD9B8] hover:border-[#D99427]'
                    }`}
                  >
                    <div className="text-base mb-1">👶</div>
                    <div>Kids Pass</div>
                    <div className="text-[10px] font-normal opacity-80">(Age ≤ 15)</div>
                  </button>
                </div>
              </div>

              {/* ATTENDEES (AADHAAR-FIRST UPLOAD & AUTO-FILL) */}
              {cashierAttendees.map((att, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#EAD9B8] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#EAD9B8] pb-2">
                    <div className="text-xs font-bold text-[#2D1F0E] uppercase flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-[#D99427] text-white flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>
                        {manualForm.passType === 'COUPLE'
                          ? idx === 0 ? 'Guest #1 (Female Partner)' : 'Guest #2 (Male Partner)'
                          : manualForm.passType === 'KIDS'
                          ? 'Child Guest Details'
                          : 'Primary Guest Details'}
                      </span>
                    </div>

                    {att.age !== null && att.age !== undefined && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF5DC] text-[#8C6019] border border-[#EAD9B8]">
                        Age: {att.age} Years {manualForm.passType === 'KIDS' && (att.age <= 10 ? '• Free Pass (₹0)' : att.age <= 15 ? '• Tier Pass (₹1,200)' : '• Blocked (>15)')}
                      </span>
                    )}
                  </div>

                  {/* STEP 1: AADHAAR CARD UPLOAD */}
                  <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] space-y-3">
                    <div className="text-[11px] font-bold text-[#6E5336] uppercase tracking-wider flex items-center justify-between">
                      <span>1. Upload Aadhaar Card (Auto-Fills Details via AI OCR)</span>
                      <span className="text-[9px] font-mono text-[#D99427] bg-white px-2 py-0.5 rounded-md border border-[#EAD9B8]">AI OCR Enabled</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Front Upload */}
                      <div className="border border-dashed border-[#D99427]/60 rounded-xl p-3 bg-white text-center hover:bg-[#FFFDF9] transition">
                        <div className="text-[10px] font-bold text-[#6E5336] mb-1">Aadhaar Front (Photo & Name) *</div>
                        <input
                          type="file"
                          accept="image/*"
                          id={`front-upload-${idx}`}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleAadhaarUpload(idx, 'front', e.target.files[0]);
                          }}
                        />
                        <label
                          htmlFor={`front-upload-${idx}`}
                          className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[11px] font-semibold text-[#2D1F0E] transition"
                        >
                          <Upload className="w-3 h-3 text-[#D99427]" />
                          <span>{att.isUploadingFront ? 'Extracting OCR...' : att.documentFrontName ? 'Replace Front' : 'Upload Front Side'}</span>
                        </label>
                        {att.documentFrontName && (
                          <div className="text-[9px] text-emerald-700 font-medium mt-1 truncate">
                            ✓ {att.documentFrontName}
                          </div>
                        )}
                      </div>

                      {/* Back Upload */}
                      <div className="border border-dashed border-[#EAD9B8] rounded-xl p-3 bg-white text-center hover:bg-[#FFFDF9] transition">
                        <div className="text-[10px] font-bold text-[#6E5336] mb-1">Aadhaar Back (Address Side)</div>
                        <input
                          type="file"
                          accept="image/*"
                          id={`back-upload-${idx}`}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleAadhaarUpload(idx, 'back', e.target.files[0]);
                          }}
                        />
                        <label
                          htmlFor={`back-upload-${idx}`}
                          className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[11px] font-semibold text-[#2D1F0E] transition"
                        >
                          <Upload className="w-3 h-3 text-[#D99427]" />
                          <span>{att.isUploadingBack ? 'Saving Back...' : att.documentBackName ? 'Replace Back' : 'Upload Back Side'}</span>
                        </label>
                        {att.documentBackName && (
                          <div className="text-[9px] text-emerald-700 font-medium mt-1 truncate">
                            ✓ {att.documentBackName}
                          </div>
                        )}
                      </div>
                    </div>

                    {att.uploadError && (
                      <div className="text-[10px] text-rose-600 font-medium">{att.uploadError}</div>
                    )}
                  </div>

                  {/* STEP 2: VERIFIED GUEST DETAILS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Name as on Aadhaar"
                        value={att.fullName}
                        onChange={(e) => updateCashierAttendee(idx, 'fullName', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">WhatsApp Phone</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={att.phone}
                        onChange={(e) => updateCashierAttendee(idx, 'phone', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">Gender *</label>
                      <select
                        value={att.gender}
                        onChange={(e) => updateCashierAttendee(idx, 'gender', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                      >
                        <option value="FEMALE">Female</option>
                        <option value="MALE">Male</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">12-Digit Aadhaar #</label>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="XXXXXXXXXXXX"
                        value={att.aadhaarNumber}
                        onChange={(e) => updateCashierAttendee(idx, 'aadhaarNumber', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAD9B8] text-xs font-mono focus:border-[#D99427] outline-none"
                      />
                    </div>

                    {/* Date of Birth Field */}
                    <div className="col-span-1 sm:col-span-2">
                      <PremiumDatePicker
                        label="Date of Birth (Auto-filled from Aadhaar)"
                        value={att.dob}
                        onChange={(dateStr) => updateCashierAttendee(idx, 'dob', dateStr)}
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="guest@example.com"
                        value={att.email}
                        onChange={(e) => updateCashierAttendee(idx, 'email', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* PAYMENT CONFIGURATION: CASH VS UPI QR */}
              <div className="p-5 rounded-2xl bg-[#FAF6EE] border-2 border-[#EAD9B8] space-y-4">
                <div className="text-xs font-bold text-[#2D1F0E] uppercase tracking-wider">
                  Payment Mode & Settlement Amount
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: CASH */}
                  <button
                    type="button"
                    onClick={() => setManualForm({ ...manualForm, paymentMethod: 'CUSTOM_DIRECT' })}
                    className={`p-4 rounded-2xl border-2 text-left flex items-start space-x-3 transition ${
                      manualForm.paymentMethod === 'CUSTOM_DIRECT'
                        ? 'bg-white border-[#2D1F0E] shadow-md ring-2 ring-[#D99427]/40'
                        : 'bg-[#FAF6EE] border-[#EAD9B8] hover:border-[#D99427]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      💵
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#2D1F0E]">Cash Payment</div>
                      <div className="text-[11px] text-[#6E5336] mt-0.5">
                        Collect cash at desk and immediately mint passes with cash receipt.
                      </div>
                    </div>
                  </button>

                  {/* Option 2: RAZORPAY / UPI DYNAMIC QR */}
                  <button
                    type="button"
                    onClick={() => setManualForm({ ...manualForm, paymentMethod: 'UPI_QR' })}
                    className={`p-4 rounded-2xl border-2 text-left flex items-start space-x-3 transition ${
                      manualForm.paymentMethod === 'UPI_QR'
                        ? 'bg-white border-[#2D1F0E] shadow-md ring-2 ring-[#D99427]/40'
                        : 'bg-[#FAF6EE] border-[#EAD9B8] hover:border-[#D99427]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      📱
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#2D1F0E]">Razorpay / Dynamic UPI QR</div>
                      <div className="text-[11px] text-[#6E5336] mt-0.5">
                        Display dynamic QR on screen for customer to scan with PhonePe, GPay, Paytm.
                      </div>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Settlement Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={manualForm.customAmount}
                      onChange={(e) => setManualForm({ ...manualForm, customAmount: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-sm font-serif font-bold text-emerald-800 focus:border-[#D99427] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Desk Reason / Notes</label>
                    <input
                      type="text"
                      value={manualForm.notes}
                      onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs uppercase tracking-widest hover:opacity-95 transition shadow-lg shadow-[#D99427]/25 disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>
                    {submittingManual
                      ? 'Processing Settlement...'
                      : manualForm.paymentMethod === 'CUSTOM_DIRECT'
                      ? `Confirm Cash & Mint Passes (₹${Number(manualForm.customAmount).toLocaleString()})`
                      : `Generate Dynamic UPI QR & Collect (₹${Number(manualForm.customAmount).toLocaleString()})`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* SUCCESS & PASS PRESENTATION */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center text-2xl mx-auto font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">
                  Passes Minted Successfully!
                </h3>
                <p className="text-xs text-[#6E5336] mt-1 font-mono">
                  Receipt #{manualSuccessResult.payment?.receiptNumber} • Application #{manualSuccessResult.registration?.registrationNumber}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-left max-w-lg mx-auto space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-[#6E5336]">Amount Settled:</span>
                  <span className="font-bold text-emerald-800 font-serif text-sm">₹{Number(manualSuccessResult.payment?.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E5336]">Payment Method:</span>
                  <span className="font-bold">{manualSuccessResult.payment?.method === 'CUSTOM_DIRECT' ? '💵 CASH AT DESK' : '📱 DYNAMIC UPI QR'}</span>
                </div>
                <div className="flex justify-between border-t border-[#EAD9B8] pt-2">
                  <span className="text-[#6E5336]">Issued Passes:</span>
                  <span className="font-bold text-[#D99427]">{manualSuccessResult.credentials?.length || 1} Active Digital Pass(es)</span>
                </div>
              </div>

              {/* OFFICIAL SAFED SHERI 2026 MINTED PASSES */}
              {manualSuccessResult.credentials && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-2">
                  {manualSuccessResult.credentials.map((cred: any, idx: number) => {
                    const attendeeName = cred.attendee?.fullName || cashierAttendees[idx]?.fullName || 'Guest Attendee';
                    const attendeePhone = cred.attendee?.phone || cashierAttendees[idx]?.phone || '';
                    const aadhaarMasked = cred.attendee?.aadhaarMasked || (cashierAttendees[idx]?.aadhaarNumber ? `XXXX XXXX ${cashierAttendees[idx]?.aadhaarNumber.replace(/\D/g, '').slice(-4)}` : 'XXXX XXXX XXXX');
                    const passType = manualSuccessResult.registration?.passType || manualForm.passType;
                    const passCode = cred.passCode || cred.credentialNumber || `SS26-${passType}-${cred.id?.slice(0, 4)?.toUpperCase()}`;

                    return (
                      <div
                        key={idx}
                        className="p-6 rounded-3xl bg-gradient-to-b from-[#FFFDF9] via-white to-[#FAF6EE] border-2 border-[#D99427] text-[#2D1F0E] text-center space-y-3.5 shadow-xl relative overflow-hidden"
                      >
                        {/* Top Watermark / Brand Header */}
                        <div className="flex justify-center mb-1">
                          <LogoSlot size="sm" />
                        </div>
                        <div className="text-[10px] tracking-[0.25em] font-extrabold uppercase text-[#8C6019]">
                          SAFED SHERI 2026 • OFFICIAL ENTRY PASS
                        </div>

                        <div className="flex justify-center">
                          <span className="px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#FFF5DC] text-[#8C6019] border border-[#E5A93C] shadow-sm">
                            {passType === 'SINGLE' ? '💃 SINGLE PASS (FEMALE)' : passType === 'COUPLE' ? `👫 COUPLE PASS (${idx + 1}/2)` : passType === 'KIDS' ? '👶 KIDS PASS' : '👑 GAZEBO VIP'}
                          </span>
                        </div>

                        {/* High-Resolution Gate QR Code */}
                        <div className="flex justify-center p-3 bg-white rounded-2xl border-2 border-[#D99427]/40 shadow-inner inline-block mx-auto">
                          <QRCodeSVG
                            value={cred.secureToken || cred.qrPayload || `SS26-${cred.id}`}
                            size={175}
                            level="H"
                            includeMargin={true}
                          />
                        </div>

                        {/* Pass Code */}
                        <div className="text-xl font-mono font-extrabold tracking-widest text-[#2D1F0E] bg-white py-1.5 px-4 rounded-xl border border-[#EAD9B8] inline-block shadow-sm">
                          {passCode}
                        </div>

                        {/* Attendee Details Card */}
                        <div className="bg-[#FAF6EE] p-3.5 rounded-2xl border border-[#EAD9B8] text-xs space-y-1.5 text-left">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-[9px] font-mono text-[#8C6019] uppercase tracking-wider">ATTENDEE NAME</div>
                              <div className="font-serif font-bold text-sm text-[#2D1F0E]">{attendeeName}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ACTIVE ✓
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-[#EAD9B8]/60 text-[#6E5336]">
                            <div>
                              <span className="text-[#8C6019]">PHONE:</span> {attendeePhone || '—'}
                            </div>
                            <div>
                              <span className="text-[#8C6019]">AADHAAR:</span> {aadhaarMasked}
                            </div>
                            <div className="col-span-2">
                              <span className="text-[#8C6019]">APP NO:</span> {manualSuccessResult.registration?.registrationNumber}
                            </div>
                          </div>
                        </div>

                        {/* Event Guidance */}
                        <div className="text-[10px] text-[#6E5336] bg-white/70 p-2.5 rounded-xl border border-[#EAD9B8] leading-relaxed">
                          Present this digital pass at the Security Gate on <strong>09 October 2026</strong> • Regency Lagoon Resort, Rajkot.
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-2.5 rounded-full bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D99427]" />
                  <span>Print Receipt & Passes</span>
                </button>
                <button
                  onClick={() => {
                    setManualSuccessResult(null);
                    handlePassTypeChange('SINGLE');
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#2D1F0E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#4A351B] transition shadow-md"
                >
                  + New Guest Booking
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DYNAMIC QR MODAL (FOR ON-SPOT UPI QR) */}
      {activeQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border-2 border-[#EAD9B8] rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-scale-in">
            <div className="flex justify-between items-center border-b border-[#EAD9B8] pb-3">
              <span className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-wider">
                DYNAMIC UPI QR SETTLEMENT
              </span>
              <button onClick={() => setActiveQrModal(null)}><X className="w-5 h-5 text-[#6E5336]" /></button>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-[#2D1F0E]">Scan with PhonePe, GPay, or Paytm</h3>
              <p className="text-xs text-[#6E5336]">
                Application #{activeQrModal.registration?.registrationNumber}
              </p>
            </div>

            <div className="flex justify-center p-4 bg-[#FAF6EE] rounded-2xl border-2 border-[#D99427]/40 inline-block mx-auto shadow-inner">
              <QRCodeSVG value={activeQrModal.upiPayload} size={200} level="M" />
            </div>

            <div className="text-2xl font-serif font-bold text-emerald-800">
              Amount Due: ₹{Number(activeQrModal.amountDue).toLocaleString()}
            </div>

            <button
              onClick={() => {
                setManualSuccessResult(activeQrModal);
                setActiveQrModal(null);
              }}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition shadow-md"
            >
              ✓ Payment Received & Mint Passes
            </button>
          </div>
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
