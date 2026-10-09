'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest, getAuthToken, getStoredUser } from '../../lib/api';
import {
  Sparkles,
  Ticket,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ExternalLink,
  Printer,
  PlusCircle,
  Lock,
  User,
  Phone,
  Calendar,
  CreditCard,
  DollarSign,
  Crown,
  QrCode,
  Users,
  Eye,
  Check,
  X,
  MessageCircle,
} from 'lucide-react';
import { PremiumDatePicker } from './PremiumDatePicker';
import { AdvancedTabulatorTable, TabulatorColumn } from './AdvancedTabulatorTable';

interface GuestFormAttendee {
  fullName: string;
  phone: string;
  email: string;
  gender: 'FEMALE' | 'MALE';
  dob: string;
  age?: number | null;
  kidsAgeGroup?: string;
  overrideNotes?: string;
}

export default function MasterInstantPassPanel({ currentUser }: { currentUser?: any }) {
  const [user, setUser] = useState<any>(currentUser || null);
  const [passType, setPassType] = useState<'SINGLE' | 'COUPLE' | 'KIDS' | 'GAZEBO'>('SINGLE');
  const [customAmount, setCustomAmount] = useState<number>(4500);
  const [paymentMethod, setPaymentMethod] = useState<'CUSTOM_DIRECT' | 'FAMILY_AND_FRIENDS' | 'UPI_QR'>('CUSTOM_DIRECT');
  const [adminNotes, setAdminNotes] = useState<string>('Master Admin Spot Pass (No Aadhaar Card)');

  const [attendees, setAttendees] = useState<GuestFormAttendee[]>([
    {
      fullName: '',
      phone: '',
      email: '',
      gender: 'FEMALE',
      dob: '',
      age: null,
      overrideNotes: '',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<any | null>(null);

  // Recent Passes Table State
  const [recentPasses, setRecentPasses] = useState<any[]>([]);
  const [loadingPasses, setLoadingPasses] = useState(false);

  useEffect(() => {
    if (!user) {
      const u = getStoredUser();
      setUser(u);
    }
    loadRecentPasses();
  }, []);

  async function loadRecentPasses() {
    setLoadingPasses(true);
    const res = await apiRequest('/registrations');
    if (res.success && res.data) {
      // Sort by newest registrations
      setRecentPasses(res.data);
    }
    setLoadingPasses(false);
  }

  function handlePassTypeChange(newType: 'SINGLE' | 'COUPLE' | 'KIDS' | 'GAZEBO') {
    setPassType(newType);
    let defaultPrice = 4500;
    if (newType === 'SINGLE') defaultPrice = 4500;
    if (newType === 'COUPLE') defaultPrice = 8500;
    if (newType === 'KIDS') defaultPrice = 1800;
    if (newType === 'GAZEBO') defaultPrice = 85000;

    if (paymentMethod === 'FAMILY_AND_FRIENDS') {
      defaultPrice = 0;
    }
    setCustomAmount(defaultPrice);

    if (newType === 'COUPLE') {
      setAttendees([
        { fullName: '', phone: '', email: '', gender: 'FEMALE', dob: '', age: null, overrideNotes: '' },
        { fullName: '', phone: '', email: '', gender: 'MALE', dob: '', age: null, overrideNotes: '' },
      ]);
    } else if (newType === 'KIDS') {
      setAttendees([
        { fullName: '', phone: '', email: '', gender: 'FEMALE', dob: '', age: null, kidsAgeGroup: 'UNDER_10', overrideNotes: '' },
      ]);
    } else {
      setAttendees([
        { fullName: '', phone: '', email: '', gender: 'FEMALE', dob: '', age: null, overrideNotes: '' },
      ]);
    }
  }

  function updateAttendee(index: number, field: keyof GuestFormAttendee, value: any) {
    setAttendees((prev) => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      copy[index] = { ...copy[index], [field]: value };

      if (passType === 'KIDS' && field === 'dob' && value) {
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
            setCustomAmount(0);
          } else if (age > 10 && age <= 15) {
            copy[index].kidsAgeGroup = 'AGE_11_15';
            setCustomAmount(1500);
          }
        }
      }
      return copy;
    });
  }

  async function handleMintPass(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Strict Master Admin Guard
    if (user?.username !== 'masteradmin@safedsheri.com') {
      setError('Strict clearance violation: Only Master Admin can mint passes without Aadhaar.');
      return;
    }

    // Basic Validation
    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];
      if (!att.fullName || att.fullName.trim().length < 2) {
        setError(`Guest #${i + 1} Full Name is required.`);
        return;
      }
      const cleanPhone = att.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError(`Guest #${i + 1} valid 10-digit WhatsApp Phone number is required.`);
        return;
      }
    }

    if (passType === 'COUPLE') {
      if (attendees.length !== 2) {
        setError('Couple Pass strictly requires 2 guests.');
        return;
      }
      const femaleCount = attendees.filter((a) => a.gender === 'FEMALE').length;
      const maleCount = attendees.filter((a) => a.gender === 'MALE').length;
      if (femaleCount !== 1 || maleCount !== 1) {
        setError('Couple Pass strictly requires 1 Female and 1 Male partner.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const payloadAttendees = attendees.map((att, idx) => ({
        fullName: att.fullName.trim(),
        phone: att.phone.startsWith('+91') ? att.phone : `+91${att.phone.replace(/\D/g, '').slice(-10)}`,
        email: att.email?.trim() || undefined,
        gender: att.gender,
        // Intentionally no Aadhaar: Send empty/dummy string so backend generates unique bypass HMAC & tag
        aadhaarNumber: '',
        dob: att.dob || undefined,
        kidsAgeGroup: att.kidsAgeGroup || undefined,
      }));

      const res = await apiRequest('/payments/manual-entry', {
        method: 'POST',
        body: JSON.stringify({
          passType,
          customAmount: Number(customAmount),
          paymentMethod,
          attendees: payloadAttendees,
          notes: `[MASTER ADMIN BYPASS - NO AADHAAR] ${adminNotes || 'Spot Walk-In Instant Pass'}${
            attendees[0].overrideNotes ? ` | Note: ${attendees[0].overrideNotes}` : ''
          }`,
        }),
      });

      setSubmitting(false);

      if (res.success && res.data) {
        setSuccessResult(res.data);
        await loadRecentPasses();
      } else {
        setError(res.error?.message || res.message || 'Failed to mint instant pass. Please check server logs.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setError(err?.message || 'Unexpected network error occurred.');
    }
  }

  function handleResetForm() {
    setSuccessResult(null);
    setError(null);
    handlePassTypeChange('SINGLE');
    setAdminNotes('Master Admin Spot Pass (No Aadhaar Card)');
  }

  // Format WhatsApp message
  function getWhatsAppShareUrl(primaryAttendee: any, regNum: string, passCode?: string, payLink?: string) {
    const phone = (primaryAttendee.phone || '').replace(/\D/g, '').slice(-10);
    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://safedsheri.com';
    const passUrl = payLink ? `${domain}/order/${payLink}` : `${domain}`;

    const text = `🎉 *SAFED SHERI 2026 — YOUR PASS IS CONFIRMED!*

Hello *${primaryAttendee.fullName}*,
Your entry pass for Safed Sheri 2026 has been successfully issued by the Master Administration desk.

🎟️ *Pass Category:* ${passType}
📄 *Registration No:* ${regNum}
${passCode ? `🔑 *Pass Code:* ${passCode}\n` : ''}
🔗 *Access Digital Pass & Entry QR:*
${passUrl}

Please present this QR code at the venue gate for instant scanning. See you at the festival!`;

    return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
  }

  // Table columns for Recent Issued Passes
  const recentColumns: TabulatorColumn<any>[] = [
    {
      key: 'registrationNumber',
      title: 'Registration #',
      sortable: true,
      render: (r) => (
        <span className="font-mono font-bold text-[#8C6019] bg-[#FFF5DC] px-2 py-0.5 rounded border border-[#E5A93C]">
          {r.registrationNumber}
        </span>
      ),
    },
    {
      key: 'passType',
      title: 'Pass Category',
      sortable: true,
      render: (r) => (
        <span className="font-serif font-bold text-xs text-[#2D1F0E]">
          {r.passType}
        </span>
      ),
    },
    {
      key: 'primaryAttendee',
      title: 'Primary Guest & Phone',
      sortable: true,
      getValue: (r) => r.attendees?.[0]?.attendee?.fullName || '',
      render: (r) => {
        const att = r.attendees?.[0]?.attendee;
        return (
          <div>
            <div className="font-bold text-xs text-[#2D1F0E]">{att?.fullName || '—'}</div>
            <div className="text-[10px] font-mono text-[#6E5336]">{att?.phone || '—'}</div>
          </div>
        );
      },
    },
    {
      key: 'credentials',
      title: 'Pass Code(s)',
      sortable: false,
      render: (r) => {
        const creds = r.credentials || [];
        if (creds.length === 0) return <span className="text-[10px] text-stone-400 font-mono">—</span>;
        return (
          <div className="space-y-1">
            {creds.map((c: any) => (
              <span key={c.id} className="inline-block font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-950 mr-1">
                {c.passCode || c.credentialNumber}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'amountDue',
      title: 'Amount (₹)',
      sortable: true,
      isNumeric: true,
      align: 'right',
      render: (r) => (
        <span className="font-serif font-bold text-emerald-800 text-xs">
          ₹{Number(r.amountDue)?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          r.status === 'PASS_ISSUED'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : 'bg-amber-100 text-amber-900 border border-amber-300'
        }`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Issued Time',
      sortable: true,
      getValue: (r) => new Date(r.createdAt).toISOString(),
      render: (r) => (
        <span className="text-[#6E5336] font-mono text-[11px]">
          {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Action',
      sortable: false,
      align: 'right',
      render: (r) => {
        const creds = r.credentials || [];
        const payLink = r.paymentLinkId;
        const primaryAtt = r.attendees?.[0]?.attendee;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {creds.length > 0 && (
              <button
                onClick={() => setActiveQrModal({ reg: r, credentials: creds })}
                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 transition"
                title="View Pass QR"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            )}
            {primaryAtt && primaryAtt.phone && (
              <a
                href={getWhatsAppShareUrl(primaryAtt, r.registrationNumber, creds[0]?.passCode, payLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition"
                title="Share via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
            {payLink && (
              <a
                href={`/order/${payLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-300 text-stone-700 transition"
                title="Open Public Pass View"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. MASTER ADMIN SPECIAL CLEARANCE HERO CARD */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#1C160F] via-[#2D1F0E] to-[#1C160F] text-[#FAF6EE] p-6 sm:p-8 rounded-3xl border-2 border-amber-400 shadow-2xl relative overflow-hidden">
        {/* Ambient Gold Halo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#F6C85F]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>MASTER ADMIN PRIVILEGE ONLY</span>
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ⚡ Instant Pass Mint (No Aadhaar)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
              Emergency Spot Pass Booking &amp; Instant Issuance
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Generate passes immediately when an attendee’s Aadhaar card data is missing, lost, or undergoing spot exception handling. The pass is minted directly with an active status and ready-to-scan QR code.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-300/30 text-right">
              <div className="text-[10px] font-mono text-amber-300 uppercase tracking-widest">Active Executive</div>
              <div className="text-sm font-bold text-white font-mono">{user?.fullName || user?.username}</div>
            </div>
            <button
              onClick={loadRecentPasses}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider transition shadow flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPasses ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUCCESS CARD WITH INSTANT PASS & LIVE QR DISPLAY */}
      {/* ========================================================================= */}
      {successResult && (
        <div className="bg-gradient-to-br from-white via-[#FAF6EE] to-[#FFF5DC] border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  PASS MINTED &amp; ACTIVE
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F0E] mt-1">
                  Registration #{successResult.registration?.registrationNumber}
                </h3>
              </div>
            </div>

            <button
              onClick={handleResetForm}
              className="px-5 py-2.5 rounded-xl bg-[#2D1F0E] text-white hover:bg-[#3D2C15] font-bold text-xs uppercase tracking-wider transition shadow flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Mint Another Pass</span>
            </button>
          </div>

          {/* Credentials / QR Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(successResult.credentials || []).map((cred: any, cIdx: number) => {
              const domain = typeof window !== 'undefined' ? window.location.origin : 'https://safedsheri.com';
              const qrValue = cred.secureToken || cred.passCode || cred.credentialNumber;
              const payLink = successResult.registration?.paymentLinkId;

              return (
                <div
                  key={cred.id || cIdx}
                  className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-md relative overflow-hidden flex flex-col sm:flex-row gap-5 items-center"
                >
                  {/* QR Box */}
                  <div className="bg-[#FFFDF9] p-3 rounded-2xl border border-amber-200 shadow-inner flex flex-col items-center shrink-0">
                    <QRCodeSVG
                      value={qrValue}
                      size={140}
                      level="H"
                      includeMargin={true}
                    />
                    <span className="text-[9px] font-mono font-bold text-amber-900 mt-1 uppercase tracking-wider">
                      Gate Entry QR
                    </span>
                  </div>

                  {/* Pass Details */}
                  <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#FFF5DC] text-[#8C6019] border border-[#E5A93C]">
                        {cred.registration?.passType || passType} PASS
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {cred.status}
                      </span>
                    </div>

                    <div>
                      <div className="text-base font-bold text-[#2D1F0E]">
                        {cred.attendee?.fullName || attendees[cIdx]?.fullName || 'Guest Attendee'}
                      </div>
                      <div className="text-xs font-mono text-[#6E5336]">
                        {cred.attendee?.phone || attendees[cIdx]?.phone || '—'}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-center">
                      <div className="text-[9px] text-[#8C6019] uppercase font-bold">Pass Code</div>
                      <div className="text-sm font-extrabold text-[#2D1F0E] tracking-wider">
                        {cred.passCode || cred.credentialNumber}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <a
                        href={getWhatsAppShareUrl(cred.attendee || attendees[cIdx], successResult.registration.registrationNumber, cred.passCode, payLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp QR</span>
                      </a>
                      {payLink && (
                        <a
                          href={`/order/${payLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-bold text-xs transition flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Pass</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN PASS BOOKING FORM (NO AADHAAR REQUIRED) */}
      {/* ========================================================================= */}
      {!successResult && (
        <form onSubmit={handleMintPass} className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#EAD9B8] shadow-lg space-y-8">
          <div className="border-b border-[#EAD9B8] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-serif font-bold text-[#2D1F0E] flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#D99427]" />
                <span>Instant Pass Minting Form</span>
              </h3>
              <p className="text-xs text-[#6E5336] mt-0.5">
                Fill in the attendee details below. Aadhaar card verification is officially bypassed by Master Admin authority.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>No Aadhaar Required</span>
              </span>
            </div>
          </div>

          {/* STEP 1: PASS CATEGORY SELECTOR */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5336]">
              1. Select Pass Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { type: 'SINGLE', label: 'Single Female', desc: '1 Female Guest', icon: User, defaultPrice: 4500 },
                { type: 'COUPLE', label: 'Couple Duo', desc: '1 Female + 1 Male', icon: Users, defaultPrice: 8500 },
                { type: 'KIDS', label: 'Kids Pass', desc: 'Child (≤15 Years)', icon: Ticket, defaultPrice: 1800 },
                { type: 'GAZEBO', label: 'Gazebo VIP', desc: 'VIP Lounge Spot Pass', icon: Crown, defaultPrice: 85000 },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = passType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handlePassTypeChange(item.type as any)}
                    className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#FFF5DC] to-white border-[#D99427] shadow-md ring-2 ring-[#D99427]/30'
                        : 'bg-[#FAF6EE] border-[#EAD9B8] hover:bg-white text-[#6E5336]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#D99427] text-white' : 'bg-white text-[#6E5336] border border-[#EAD9B8]'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-serif font-bold text-xs text-[#2D1F0E]">
                        ₹{item.defaultPrice.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2D1F0E]">{item.label}</div>
                      <div className="text-[10px] text-[#6E5336] mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: GUEST ATTENDEE DETAILS (NO AADHAAR) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5336]">
                2. Guest Details ({attendees.length} {attendees.length === 1 ? 'Guest' : 'Guests'})
              </label>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                ✓ Aadhaar Document Requirement Waived
              </span>
            </div>

            <div className="space-y-4">
              {attendees.map((att, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAD9B8] space-y-4 relative"
                >
                  <div className="flex items-center justify-between border-b border-[#EAD9B8] pb-2">
                    <span className="text-xs font-bold text-[#2D1F0E] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2D1F0E] text-white flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </span>
                      <span>
                        {passType === 'COUPLE'
                          ? idx === 0
                            ? 'Guest 1 (Female Partner)'
                            : 'Guest 2 (Male Partner)'
                          : passType === 'KIDS'
                          ? 'Child Guest Details'
                          : 'Primary Guest Details'}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      Bypassed Aadhaar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">
                        Full Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Radhika Patel"
                        value={att.fullName}
                        onChange={(e) => updateAttendee(idx, 'fullName', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs font-semibold text-[#2D1F0E] focus:border-[#D99427] outline-none"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">
                        WhatsApp Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit number (e.g. 9876543210)"
                        value={att.phone}
                        onChange={(e) => updateAttendee(idx, 'phone', e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs font-mono font-semibold text-[#2D1F0E] focus:border-[#D99427] outline-none"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">
                        Gender *
                      </label>
                      <select
                        value={att.gender}
                        onChange={(e) => updateAttendee(idx, 'gender', e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs font-bold text-[#2D1F0E] focus:border-[#D99427] outline-none cursor-pointer"
                      >
                        <option value="FEMALE">FEMALE</option>
                        <option value="MALE">MALE</option>
                      </select>
                    </div>

                    {/* Date of Birth / Age */}
                    <div>
                      <PremiumDatePicker
                        label={passType === 'KIDS' ? 'Child Date of Birth *' : 'Date of Birth (Optional)'}
                        value={att.dob}
                        onChange={(dateStr) => updateAttendee(idx, 'dob', dateStr)}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="guest@example.com"
                        value={att.email}
                        onChange={(e) => updateAttendee(idx, 'email', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none"
                      />
                    </div>

                    {/* Alternate ID or Note */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">
                        Alternate Reference / Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. DL / Pan / Spot Verified"
                        value={att.overrideNotes}
                        onChange={(e) => updateAttendee(idx, 'overrideNotes', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3: PAYMENT METHOD & CUSTOM AMOUNT */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5336]">
              3. Payment Settlement Mode &amp; Amount
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'CUSTOM_DIRECT',
                  label: '💵 Spot Cash / Counter Paid',
                  desc: 'Collected on spot at counter. Mints pass immediately.',
                },
                {
                  id: 'FAMILY_AND_FRIENDS',
                  label: '👥 Complimentary VIP (₹0)',
                  desc: 'Free / Sponsor pass. Zero charges applied.',
                },
                {
                  id: 'UPI_QR',
                  label: '📱 Dynamic UPI QR',
                  desc: 'Generate Razorpay UPI QR for customer to scan on spot.',
                },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      if (m.id === 'FAMILY_AND_FRIENDS') setCustomAmount(0);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF6EE] border-[#D99427] shadow-sm ring-1 ring-[#D99427]'
                        : 'bg-white border-[#EAD9B8] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <div className="font-bold text-xs text-[#2D1F0E]">{m.label}</div>
                    <div className="text-[10px] text-[#6E5336] mt-1">{m.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">
                  Payable Pass Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-[#D99427]">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    disabled={paymentMethod === 'FAMILY_AND_FRIENDS'}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-base font-bold font-serif text-[#2D1F0E] focus:border-[#D99427] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6E5336] mb-1 uppercase tracking-wider">
                  Admin Audit Log Note
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Reason for missing Aadhaar booking"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-[#EAD9B8] flex items-center justify-between">
            <div className="text-xs text-[#6E5336]">
              Pass will be minted with status <strong className="text-emerald-800">PASS_ISSUED</strong> and entry QR ready immediately.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] hover:from-[#E5A93C] hover:to-[#D99427] text-[#2D1F0E] font-bold text-xs uppercase tracking-widest transition shadow-lg shadow-[#D99427]/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] transform"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Minting Pass...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ Mint Instant Pass Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 4. RECENT PASSES TABLE & REAL-TIME LEDGER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#EAD9B8] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAD9B8]">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#2D1F0E]">
              Recent Passes Ledger &amp; QR Directory
            </h3>
            <p className="text-xs text-[#6E5336]">
              Real-time audit list of passes. Click the QR icon or WhatsApp icon on any row to re-open or send entry passes.
            </p>
          </div>
          <button
            onClick={loadRecentPasses}
            className="px-3.5 py-1.5 rounded-xl bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#6E5336] font-bold text-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPasses ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <AdvancedTabulatorTable
          data={recentPasses}
          columns={recentColumns}
          keyField="id"
          title="Master Admin Passes Directory"
          subtitle="Showing all confirmed passes issued across all tiers"
          defaultPageSize={10}
          isLoading={loadingPasses}
          onRefresh={loadRecentPasses}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODAL: QUICK VIEW QR CODE FOR RECENT PASS */}
      {/* ========================================================================= */}
      {activeQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-amber-300 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-[#EAD9B8] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#8C6019] bg-[#FFF5DC] px-2 py-0.5 rounded border border-[#E5A93C]">
                  {activeQrModal.reg?.passType} PASS
                </span>
                <h4 className="text-xl font-serif font-bold text-[#2D1F0E] mt-1">
                  Registration #{activeQrModal.reg?.registrationNumber}
                </h4>
              </div>
              <button
                onClick={() => setActiveQrModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(activeQrModal.credentials || []).map((c: any, idx: number) => {
                const qrVal = c.secureToken || c.passCode || c.credentialNumber;
                return (
                  <div key={c.id || idx} className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl border border-amber-200 shrink-0">
                      <QRCodeSVG value={qrVal} size={100} level="H" includeMargin={true} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-[#2D1F0E]">
                        {c.attendee?.fullName || `Guest #${idx + 1}`}
                      </div>
                      <div className="text-xs font-mono text-[#6E5336]">
                        {c.attendee?.phone || '—'}
                      </div>
                      <div className="font-mono text-xs font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-300 inline-block">
                        {c.passCode || c.credentialNumber}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveQrModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#2D1F0E] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
