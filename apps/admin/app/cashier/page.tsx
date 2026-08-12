'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, getStoredUser } from '../../lib/api';
import { Search, Banknote, UserPlus, CheckCircle2, AlertCircle, Printer, Ticket, ShieldCheck, Lock } from 'lucide-react';
import LogoSlot from '../components/LogoSlot';

export default function CashierTerminal() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<'payment' | 'new_reg'>('payment');

  // Locations list
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Payment Search & Confirm State
  const [searchQuery, setSearchQuery] = useState('SS-2026-000102');
  const [searching, setSearching] = useState(false);
  const [foundReg, setFoundReg] = useState<any>(null);
  const [processingPay, setProcessingPay] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // New Registration at Counter State
  const [newRegForm, setNewRegForm] = useState({
    passType: 'SINGLE' as 'SINGLE' | 'COUPLE',
    att1Name: '',
    att1Phone: '',
    att1Email: '',
    att1Aadhaar: '',
    att2Name: '',
    att2Phone: '',
    att2Aadhaar: '',
    notes: '',
  });
  const [creatingReg, setCreatingReg] = useState(false);
  const [regResult, setRegResult] = useState<any>(null);

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
    loadLocations();
  }, []);

  async function loadLocations() {
    const res = await apiRequest('/payment-locations');
    if (res.success && res.data && res.data.length > 0) {
      setLocations(res.data);
      setSelectedLocation(res.data[0].id);
    } else if (res.error?.code === 'UNAUTHORIZED') {
      setIsAuthenticated(false);
    }
  }

  async function handleSearchReg(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setFoundReg(null);
    setPaymentResult(null);
    setError('');

    const res = await apiRequest(`/registrations?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearching(false);

    if (res.success && res.data && res.data.length > 0) {
      setFoundReg(res.data[0]);
    } else {
      setError(`No registration found matching "${searchQuery}".`);
    }
  }

  async function handleConfirmCashPayment() {
    if (!foundReg || !selectedLocation) return;
    setProcessingPay(true);
    setError('');

    const res = await apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify({
        registrationId: foundReg.id,
        paymentLocationId: selectedLocation,
        notes: 'Physical cash collected at counter by Cashier Executive',
      }),
    });

    setProcessingPay(false);

    if (res.success && res.data) {
      setPaymentResult(res.data);
      setMessage(res.message || 'Physical cash payment confirmed! Active pass credentials generated.');
      setFoundReg(null);
    } else {
      setError(res.error?.message || 'Cash payment processing failed.');
    }
  }

  async function handleCreateRegistration(e: React.FormEvent) {
    e.preventDefault();
    setCreatingReg(true);
    setError('');
    setMessage('');
    setRegResult(null);

    const attendees = [
      {
        fullName: newRegForm.att1Name,
        phone: newRegForm.att1Phone,
        email: newRegForm.att1Email || undefined,
        aadhaarNumber: newRegForm.att1Aadhaar,
      },
    ];

    if (newRegForm.passType === 'COUPLE') {
      attendees.push({
        fullName: newRegForm.att2Name,
        phone: newRegForm.att2Phone || newRegForm.att1Phone,
        email: undefined,
        aadhaarNumber: newRegForm.att2Aadhaar,
      });
    }

    const res = await apiRequest('/registrations/counter', {
      method: 'POST',
      body: JSON.stringify({
        passType: newRegForm.passType,
        attendees,
        paymentLocationId: selectedLocation || undefined,
        notes: newRegForm.notes || undefined,
      }),
    });

    setCreatingReg(false);

    if (res.success && res.data) {
      setRegResult(res.data);
      setMessage('Counter registration created and cash payment recorded successfully!');
    } else {
      setError(res.error?.message || 'Counter registration failed.');
    }
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#2D2319] flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-white border border-amber-400/30 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <LogoSlot className="justify-center mx-auto" />
          <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-cinzel text-[#1C160F]">CASHIER TERMINAL LOGIN REQUIRED</h2>
            <p className="text-xs text-slate-600 mt-2">
              You must sign in with Cashier / Finance credentials to process counter payments.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
          >
            Go to Staff Login Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2319] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-amber-300/40 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <LogoSlot />
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold block mb-1">CASHIER & TICKETING TERMINAL</span>
              <h2 className="text-2xl font-bold text-[#1C160F] font-cinzel">Physical Cash & Receipt Counter</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-[#FAF7F2] border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold text-[#1C160F] focus:outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  Counter: {loc.name} ({loc.locationCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setActiveMode('payment')}
            className={`p-4 rounded-2xl border text-center transition-all flex items-center justify-center gap-3 font-bold text-sm ${
              activeMode === 'payment'
                ? 'bg-amber-500 text-slate-950 shadow-md border-amber-500'
                : 'bg-white text-slate-700 hover:bg-amber-50 border-amber-200'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Collect Cash for Online Booking</span>
          </button>

          <button
            onClick={() => setActiveMode('new_reg')}
            className={`p-4 rounded-2xl border text-center transition-all flex items-center justify-center gap-3 font-bold text-sm ${
              activeMode === 'new_reg'
                ? 'bg-amber-500 text-slate-950 shadow-md border-amber-500'
                : 'bg-white text-slate-700 hover:bg-amber-50 border-amber-200'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span>New Counter Walk-in Registration</span>
          </button>
        </div>

        {/* MODE A: Search & Confirm Online Booking Cash Payment */}
        {activeMode === 'payment' && (
          <div className="bg-white border border-amber-300/40 rounded-3xl p-6 space-y-6 shadow-sm">
            <form onSubmit={handleSearchReg} className="space-y-4">
              <label className="block text-xs font-semibold uppercase text-slate-600">Search Registration Number / Phone / Aadhaar</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. SS-2026-000102"
                  className="flex-1 bg-[#FAF7F2] border border-amber-200 rounded-xl px-4 py-3 text-base text-[#1C160F] font-mono focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 shrink-0 shadow-xs"
                >
                  {searching ? 'Searching...' : 'Search Booking'}
                </button>
              </div>
            </form>

            {foundReg && (
              <div className="p-6 bg-[#FAF7F2] border border-amber-300 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono uppercase text-amber-800 block">REGISTRATION FOUND</span>
                    <h3 className="font-cinzel text-xl font-bold text-[#1C160F]">{foundReg.registrationNumber}</h3>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-xs font-bold text-amber-900">
                    STATUS: {foundReg.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Pass Type:</span>
                    <strong className="text-[#1C160F] text-sm">{foundReg.passType} ({foundReg.attendees?.length || 1} Person)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Amount Due:</span>
                    <strong className="text-amber-800 text-base">₹{Number(foundReg.totalPrice).toLocaleString()}</strong>
                  </div>
                </div>

                <button
                  onClick={handleConfirmCashPayment}
                  disabled={processingPay}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:from-amber-500 hover:to-yellow-600"
                >
                  {processingPay ? 'Confirming Cash & Generating Pass...' : `Confirm Receipt of ₹${Number(foundReg.totalPrice).toLocaleString()} Cash`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE B: Create New Counter Registration */}
        {activeMode === 'new_reg' && (
          <div className="bg-white border border-amber-300/40 rounded-3xl p-6 space-y-6 shadow-sm">
            <form onSubmit={handleCreateRegistration} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setNewRegForm({ ...newRegForm, passType: 'SINGLE' })}
                  className={`p-3 rounded-xl border text-center font-bold text-xs ${
                    newRegForm.passType === 'SINGLE' ? 'bg-amber-100 border-amber-400 text-[#1C160F]' : 'bg-[#FAF7F2] border-amber-200 text-slate-600'
                  }`}
                >
                  SINGLE PASS
                </button>
                <button
                  type="button"
                  onClick={() => setNewRegForm({ ...newRegForm, passType: 'COUPLE' })}
                  className={`p-3 rounded-xl border text-center font-bold text-xs ${
                    newRegForm.passType === 'COUPLE' ? 'bg-amber-100 border-amber-400 text-[#1C160F]' : 'bg-[#FAF7F2] border-amber-200 text-slate-600'
                  }`}
                >
                  COUPLE PASS
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  required
                  value={newRegForm.att1Name}
                  onChange={(e) => setNewRegForm({ ...newRegForm, att1Name: e.target.value })}
                  placeholder="Primary Attendee Full Name"
                  className="w-full bg-[#FAF7F2] border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F]"
                />
                <input
                  type="text"
                  required
                  value={newRegForm.att1Phone}
                  onChange={(e) => setNewRegForm({ ...newRegForm, att1Phone: e.target.value })}
                  placeholder="Primary Attendee WhatsApp Phone"
                  className="w-full bg-[#FAF7F2] border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F]"
                />
                <input
                  type="text"
                  required
                  value={newRegForm.att1Aadhaar}
                  onChange={(e) => setNewRegForm({ ...newRegForm, att1Aadhaar: e.target.value })}
                  placeholder="12-Digit Aadhaar Number (Mandatory)"
                  className="w-full bg-[#FAF7F2] border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] font-mono"
                />
              </div>

              {newRegForm.passType === 'COUPLE' && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-[#1C160F]">Companion Details</span>
                  <input
                    type="text"
                    required
                    value={newRegForm.att2Name}
                    onChange={(e) => setNewRegForm({ ...newRegForm, att2Name: e.target.value })}
                    placeholder="Companion Full Name"
                    className="w-full bg-[#FAF7F2] border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F]"
                  />
                  <input
                    type="text"
                    required
                    value={newRegForm.att2Aadhaar}
                    onChange={(e) => setNewRegForm({ ...newRegForm, att2Aadhaar: e.target.value })}
                    placeholder="Companion 12-Digit Aadhaar (Mandatory)"
                    className="w-full bg-[#FAF7F2] border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={creatingReg}
                className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
              >
                {creatingReg ? 'Creating Counter Registration...' : 'Create Registration & Confirm Payment'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
