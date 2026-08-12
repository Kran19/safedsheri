'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, getStoredUser } from '../../lib/api';
import { 
  Users, CreditCard, Ticket, UserCheck, Activity, Shield, Film, FileText, AlertCircle, RefreshCw, CheckCircle2, XCircle, Crown, Building2, Store, DollarSign, Settings, Lock
} from 'lucide-react';
import LogoSlot from '../components/LogoSlot';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'gazebos' | 'inquiries' | 'registrations' | 'payments' | 'entries' | 'scans' | 'audit' | 'users'>('overview');
  
  const [overview, setOverview] = useState<any>(null);
  const [pricingPhases, setPricingPhases] = useState<any[]>([]);
  const [gazebos, setGazebos] = useState<any[]>([]);
  const [gazeboInquiries, setGazeboInquiries] = useState<any[]>([]);
  const [sponsorInquiries, setSponsorInquiries] = useState<any[]>([]);
  const [stallInquiries, setStallInquiries] = useState<any[]>([]);

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    if (!token || !user) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    setIsAuthenticated(true);
    loadOverviewData();
  }, []);

  async function loadOverviewData() {
    setLoading(true);
    setError('');
    const resOverview = await apiRequest('/reports/overview');
    if (resOverview.success) {
      setOverview(resOverview.data);
    } else if (resOverview.error?.code === 'UNAUTHORIZED') {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    const resPhases = await apiRequest('/registrations/all-phases');
    if (resPhases.success) setPricingPhases(resPhases.data || []);

    const resGazebos = await apiRequest('/gazebos');
    if (resGazebos.success) setGazebos(resGazebos.data || []);

    setLoading(false);
  }

  async function handleSwitchPricingPhase(phaseId: string) {
    setMessage('');
    setError('');
    const res = await apiRequest(`/registrations/active-phase/${phaseId}`, {
      method: 'PATCH',
    });
    if (res.success) {
      setMessage(res.message || 'Active pricing phase updated successfully.');
      loadOverviewData();
    } else {
      setError(res.error?.message || 'Failed to switch pricing phase.');
    }
  }

  async function loadTabContent(tab: string) {
    setActiveTab(tab as any);
    setMessage('');
    setError('');

    if (tab === 'gazebos' || tab === 'inquiries') {
      const resGInq = await apiRequest('/gazebos/inquiries');
      if (resGInq.success) setGazeboInquiries(resGInq.data || []);

      const resSInq = await apiRequest('/sponsor-inquiries');
      if (resSInq.success) setSponsorInquiries(resSInq.data || []);

      const resStInq = await apiRequest('/stall-inquiries');
      if (resStInq.success) setStallInquiries(resStInq.data || []);
    } else if (tab === 'registrations' && registrations.length === 0) {
      const res = await apiRequest('/registrations');
      if (res.success) setRegistrations(res.data || []);
    } else if (tab === 'payments' && payments.length === 0) {
      const res = await apiRequest('/payments');
      if (res.success) setPayments(res.data || []);
    } else if (tab === 'entries' && entries.length === 0) {
      const res = await apiRequest('/entries');
      if (res.success) setEntries(res.data || []);
    } else if (tab === 'scans' && scans.length === 0) {
      const res = await apiRequest('/scan-attempts');
      if (res.success) setScans(res.data || []);
    } else if (tab === 'audit' && auditLogs.length === 0) {
      const res = await apiRequest('/audit-logs');
      if (res.success) setAuditLogs(res.data || []);
    } else if (tab === 'users' && usersList.length === 0) {
      const res = await apiRequest('/users');
      if (res.success) setUsersList(res.data || []);
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
            <h2 className="text-xl font-bold font-cinzel text-[#1C160F]">SUPER ADMIN LOGIN REQUIRED</h2>
            <p className="text-xs text-slate-600 mt-2">
              You must sign in with Super Admin credentials to access the operational command center.
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-amber-300/40 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <LogoSlot />
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold block mb-1">SUPER ADMIN COMMAND CENTER</span>
              <h2 className="text-2xl font-bold text-[#1C160F] font-cinzel">Safed Sheri 2026 Operations</h2>
            </div>
          </div>
          <button
            onClick={loadOverviewData}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Command Stats
          </button>
        </div>

        {/* Global Alerts */}
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

        {/* Primary Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-amber-200 pb-2">
          {[
            { id: 'overview', label: 'Command Overview', icon: Activity },
            { id: 'pricing', label: 'Pricing Phases', icon: DollarSign },
            { id: 'gazebos', label: 'Gazebo Map (12 Units)', icon: Crown },
            { id: 'inquiries', label: 'Inquiry Pipeline', icon: Building2 },
            { id: 'registrations', label: 'Registrations', icon: FileText },
            { id: 'payments', label: 'Cash Payments', icon: CreditCard },
            { id: 'entries', label: 'Venue Entries', icon: UserCheck },
            { id: 'scans', label: 'Gate Scans', icon: Ticket },
            { id: 'audit', label: 'Audit Trail', icon: Shield },
            { id: 'users', label: 'Staff Users', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => loadTabContent(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-white text-slate-700 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Command Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-amber-300/40 p-5 rounded-2xl shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registrations</span>
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><FileText className="w-5 h-5" /></div>
                </div>
                <p className="text-3xl font-bold text-[#1C160F] mt-3">{overview?.registrations?.total ?? 0}</p>
                <div className="flex gap-4 mt-3 text-xs text-slate-600">
                  <span className="text-emerald-700 font-semibold">{overview?.registrations?.paid ?? 0} Paid</span>
                  <span className="text-amber-700 font-semibold">{overview?.registrations?.pending ?? 0} Pending</span>
                </div>
              </div>

              <div className="bg-white border border-amber-300/40 p-5 rounded-2xl shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Physical Cash</span>
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg"><CreditCard className="w-5 h-5" /></div>
                </div>
                <p className="text-3xl font-bold text-emerald-700 mt-3">₹{(overview?.financials?.totalCollection ?? 0).toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-3">Cash Counter Reconciled Collection</p>
              </div>

              <div className="bg-white border border-amber-300/40 p-5 rounded-2xl shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Venue Gate Entries</span>
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-lg"><UserCheck className="w-5 h-5" /></div>
                </div>
                <p className="text-3xl font-bold text-[#1C160F] mt-3">{overview?.entries?.total ?? 0}</p>
                <div className="flex gap-4 mt-3 text-xs text-slate-600">
                  <span>{overview?.entries?.qr ?? 0} QR Scan</span>
                  <span className="text-purple-700 font-semibold">{overview?.entries?.direct ?? 0} Direct Walk-in</span>
                </div>
              </div>

              <div className="bg-white border border-amber-300/40 p-5 rounded-2xl shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gate Scans</span>
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg"><Ticket className="w-5 h-5" /></div>
                </div>
                <p className="text-3xl font-bold text-[#1C160F] mt-3">{overview?.scans?.total ?? 0}</p>
                <div className="flex gap-4 mt-3 text-xs text-slate-600">
                  <span className="text-emerald-700 font-semibold">{overview?.scans?.valid ?? 0} Valid</span>
                  <span className="text-rose-700 font-semibold">{overview?.scans?.duplicateAttempts ?? 0} Rejections</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pricing Phases Control */}
        {activeTab === 'pricing' && (
          <div className="bg-white border border-amber-300/40 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-lg font-bold text-[#1C160F] font-cinzel">Authoritative Pricing Phase Switcher</h3>
            <p className="text-xs text-slate-500">Switching the active phase dynamically updates single/couple pricing for all public & cashier registrations.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              {pricingPhases.map((phase) => (
                <div
                  key={phase.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    phase.isActive
                      ? 'bg-amber-100/60 border-amber-400 text-[#1C160F] shadow-md'
                      : 'bg-[#FAF7F2] border-amber-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800">{phase.phaseName}</span>
                      {phase.isActive && (
                        <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full uppercase">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 my-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Single:</span>
                        <strong className="text-[#1C160F]">₹{Number(phase.singlePrice).toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Couple:</span>
                        <strong className="text-[#1C160F]">₹{Number(phase.couplePrice).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {!phase.isActive && (
                    <button
                      onClick={() => handleSwitchPricingPhase(phase.id)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all mt-4 shadow-xs"
                    >
                      Activate Phase
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: 12-Unit Gazebo Control Map */}
        {activeTab === 'gazebos' && (
          <div className="bg-white border border-amber-300/40 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#1C160F] font-cinzel">Physical Gazebo Inventory (12 Units)</h3>
                <p className="text-xs text-slate-500">Transaction-locked state control (`AVAILABLE` • `HELD` • `CONFIRMED`)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {gazebos.map((g) => (
                <div key={g.id} className="p-4 bg-[#FAF7F2] border border-amber-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1C160F] font-mono text-sm">{g.gazeboNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      g.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      g.status === 'HELD' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}>
                      {g.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Level {g.level}:</span>
                    <strong className="text-amber-800">₹{Number(g.price).toLocaleString()}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
