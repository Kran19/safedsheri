'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, getStoredUser } from '../../../lib/api';
import { 
  ArrowLeft, RefreshCw, Undo2, AlertTriangle, CheckCircle2, 
  Search, Users, QrCode, Filter, Shield, Clock, Ticket, Lock
} from 'lucide-react';
import Link from 'next/link';

interface ScannedPass {
  credentialId: string;
  passCode: string;
  credentialNumber: string;
  status: string;
  usedAt: string;
  attendeeName: string;
  phone: string;
  gender: string;
  registrationNumber: string;
  passType: string;
  gateId: string;
  scannedBy: string;
  entryCreatedAt: string;
}

export default function ScannedPassesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [scannedPasses, setScannedPasses] = useState<ScannedPass[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [passTypeFilter, setPassTypeFilter] = useState<string>('ALL');
  const [gateFilter, setGateFilter] = useState<string>('ALL');
  
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [confirmRevertPass, setConfirmRevertPass] = useState<ScannedPass | null>(null);
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState<boolean>(false);
  const [resetAllLoading, setResetAllLoading] = useState<boolean>(false);
  
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = getAuthToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.push('/login');
      return;
    }
    setUser(stored);
    if (stored.username === 'masteradmin@safedsheri.com') {
      loadScannedPasses();
    } else {
      setLoading(false);
    }
  }, [router]);

  async function loadScannedPasses(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await apiRequest('/entries/scanned-passes');
      if (res.success && Array.isArray(res.data)) {
        setScannedPasses(res.data);
      } else {
        setError(res.error?.message || 'Failed to load scanned passes.');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error while loading scanned passes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Handle single scan revert
  async function handleRevertSingle(pass: ScannedPass) {
    setRevertingId(pass.credentialId);
    setError('');
    setMessage('');

    try {
      const res = await apiRequest(`/entries/revert-scan/${pass.credentialId}`, {
        method: 'POST',
      });

      if (res.success) {
        setMessage(res.message || `Pass ${pass.passCode} for ${pass.attendeeName} reverted to ACTIVE!`);
        setConfirmRevertPass(null);
        await loadScannedPasses(true);
        setTimeout(() => setMessage(''), 4500);
      } else {
        setError(res.error?.message || 'Failed to revert pass scan.');
      }
    } catch (e: any) {
      setError(e?.message || 'Error occurred while reverting pass.');
    } finally {
      setRevertingId(null);
    }
  }

  // Handle bulk reset of all scans
  async function handleResetAllScans() {
    setResetAllLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await apiRequest('/entries/revert-all-scans', {
        method: 'POST',
      });

      if (res.success) {
        setMessage(res.message || 'All scanned passes reverted to ACTIVE successfully!');
        setIsResetAllModalOpen(false);
        await loadScannedPasses(true);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setError(res.error?.message || 'Failed to reset all scans.');
      }
    } catch (e: any) {
      setError(e?.message || 'Error occurred while resetting all scans.');
    } finally {
      setResetAllLoading(false);
    }
  }

  // Filtered passes calculation
  const filteredPasses = useMemo(() => {
    return scannedPasses.filter((p) => {
      // Type filter
      if (passTypeFilter !== 'ALL' && p.passType !== passTypeFilter) {
        return false;
      }
      // Gate filter
      if (gateFilter !== 'ALL' && p.gateId !== gateFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.attendeeName?.toLowerCase().includes(q);
        const matchesPhone = p.phone?.toLowerCase().includes(q);
        const matchesPassCode = p.passCode?.toLowerCase().includes(q);
        const matchesReg = p.registrationNumber?.toLowerCase().includes(q);
        const matchesGate = p.gateId?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesPassCode && !matchesReg && !matchesGate) {
          return false;
        }
      }
      return true;
    });
  }, [scannedPasses, passTypeFilter, gateFilter, searchQuery]);

  // Breakdown metrics
  const stats = useMemo(() => {
    let couple = 0;
    let single = 0;
    let kids = 0;
    let gazebo = 0;

    for (const p of scannedPasses) {
      if (p.passType === 'COUPLE') couple++;
      else if (p.passType === 'SINGLE') single++;
      else if (p.passType === 'KIDS') kids++;
      else if (p.passType === 'GAZEBO') gazebo++;
    }

    return {
      total: scannedPasses.length,
      couple,
      single,
      kids,
      gazebo,
    };
  }, [scannedPasses]);

  if (!user) return null;

  // Strict Master Admin check
  if (user?.username !== 'masteradmin@safedsheri.com') {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white border-2 border-rose-300 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-10 h-10" />
        </div>
        <div>
          <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-mono font-bold rounded-full uppercase tracking-wider">
            Strict Access Restricted
          </span>
          <h2 className="text-3xl font-serif font-bold text-rose-950 mt-3">Master Admin Clearance Required</h2>
          <p className="text-sm text-rose-800 mt-2 max-w-md mx-auto">
            This page provides live attendee scan auditing and pass revert controls. It is accessible exclusively to <strong className="font-mono">masteradmin@safedsheri.com</strong>.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#2D1F0E] text-[#FAF6EE] font-bold text-xs uppercase tracking-wider hover:bg-[#3D2C15] transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Admin Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAD9B8] pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link
              href="/admin"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#8C6019] hover:text-[#2D1F0E] bg-white border border-[#EAD9B8] px-3 py-1.5 rounded-full transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Panel</span>
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/security"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-full transition shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Gate Scanner Terminal</span>
            </Link>
          </div>
          <h2 className="text-2xl font-serif font-black text-[#2D1F0E] tracking-tight flex items-center space-x-2.5">
            <span>Live Gate Scans & Revert Manager</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-xs text-[#6E5336]">
            Inspect all attendees who have entered venue gates. Revert any accidental or test scans so the attendee can scan again tomorrow.
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadScannedPasses(true)}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-xs font-bold text-[#2D1F0E] hover:bg-amber-50/50 transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#8C6019] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Scans'}</span>
          </button>

          {scannedPasses.length > 0 && (
            <button
              onClick={() => setIsResetAllModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white text-xs font-bold uppercase tracking-wider shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Reset All Scans ({scannedPasses.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ALERT MESSAGES */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center space-x-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center space-x-2 shadow-xs animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SUMMARY STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="p-4 bg-white border-2 border-[#E5A93C]/50 rounded-2xl shadow-xs space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-[#8C6019]">TOTAL SCANNED INSIDE</div>
          <div className="text-3xl font-bold font-serif text-[#2D1F0E]">{stats.total}</div>
          <div className="text-[10px] text-[#6E5336]">Currently Scanned</div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-emerald-900">COUPLE SCANS</div>
          <div className="text-3xl font-bold font-serif text-emerald-950">{stats.couple}</div>
          <div className="text-[10px] text-emerald-800">Gate 1 Couple Passes</div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-blue-900">FEMALE / SINGLE SCANS</div>
          <div className="text-3xl font-bold font-serif text-blue-950">{stats.single}</div>
          <div className="text-[10px] text-blue-800">Gate 2 Single Passes</div>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl shadow-xs space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-purple-900">KIDS SCANS</div>
          <div className="text-3xl font-bold font-serif text-purple-950">{stats.kids}</div>
          <div className="text-[10px] text-purple-800">Gate 3 Kids Passes</div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl shadow-xs space-y-1">
          <div className="text-[10px] font-mono uppercase font-bold text-amber-900">GAZEBO VIP SCANS</div>
          <div className="text-3xl font-bold font-serif text-amber-950">{stats.gazebo}</div>
          <div className="text-[10px] text-amber-800">Gate 4 Cabana Guests</div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="p-4 bg-white border border-[#EAD9B8] rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#8C6019] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, pass code (SS26-...), or Reg #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl text-xs text-[#2D1F0E] placeholder:text-[#8C6019]/60 outline-none focus:border-[#D99427]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-[#6E5336]">
            <Filter className="w-3.5 h-3.5 text-[#8C6019]" />
            <select
              value={passTypeFilter}
              onChange={(e) => setPassTypeFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl text-xs text-[#2D1F0E] outline-none font-medium cursor-pointer"
            >
              <option value="ALL">All Categories ({scannedPasses.length})</option>
              <option value="COUPLE">Couple Pass</option>
              <option value="SINGLE">Single Pass</option>
              <option value="KIDS">Kids Pass</option>
              <option value="GAZEBO">Gazebo VIP</option>
            </select>
          </div>

          {/* Gate Filter */}
          <select
            value={gateFilter}
            onChange={(e) => setGateFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl text-xs text-[#2D1F0E] outline-none font-medium cursor-pointer"
          >
            <option value="ALL">All Gates</option>
            <option value="GATE_1">Gate 1</option>
            <option value="GATE_2">Gate 2</option>
            <option value="GATE_3">Gate 3</option>
            <option value="GATE_4">Gate 4</option>
            <option value="MASTER_ADMIN">Master Admin</option>
          </select>
        </div>
      </div>

      {/* TABLE / LIST OF SCANNED PASSES */}
      <div className="bg-white border border-[#EAD9B8] rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#D99427] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#8C6019] uppercase tracking-wider">Loading Scanned Passes...</p>
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-[#2D1F0E]">
                {scannedPasses.length === 0 ? 'No Passes Currently Scanned' : 'No Passes Match Your Filters'}
              </h3>
              <p className="text-xs text-[#6E5336] max-w-sm mx-auto">
                {scannedPasses.length === 0
                  ? 'All event passes are currently marked ACTIVE and are 100% ready for gate verification.'
                  : 'Try clearing your search query or switching filters above to see more attendees.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6EE] border-b border-[#EAD9B8] text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C6019]">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Attendee Name</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Pass Category</th>
                  <th className="py-3.5 px-4">Pass Code / Reg #</th>
                  <th className="py-3.5 px-4">Gate</th>
                  <th className="py-3.5 px-4">Scanned Time</th>
                  <th className="py-3.5 px-4">Scanned By</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAD9B8]/60">
                {filteredPasses.map((pass, index) => (
                  <tr key={pass.credentialId} className="hover:bg-amber-50/30 transition">
                    <td className="py-3 px-4 font-mono text-[#8C6019] font-bold">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2D1F0E]">{pass.attendeeName}</div>
                      <div className="text-[10px] text-[#6E5336]">{pass.gender}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#2D1F0E]">
                      {pass.phone}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        pass.passType === 'COUPLE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : pass.passType === 'SINGLE'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : pass.passType === 'KIDS'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {pass.passType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-[#8C6019]">{pass.passCode}</div>
                      <div className="text-[10px] text-slate-500">{pass.registrationNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2D1F0E]">
                      {pass.gateId.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#6E5336]">
                      {pass.usedAt ? new Date(pass.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#6E5336] truncate max-w-[120px]">
                      {pass.scannedBy}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setConfirmRevertPass(pass)}
                        disabled={revertingId === pass.credentialId}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 border border-emerald-300 rounded-xl font-bold text-[11px] transition shadow-2xs flex items-center space-x-1.5 ml-auto cursor-pointer disabled:opacity-50"
                      >
                        <Undo2 className="w-3 h-3 text-emerald-600" />
                        <span>{revertingId === pass.credentialId ? 'Reverting...' : 'Revert Scan'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SINGLE REVERT CONFIRMATION MODAL */}
      {confirmRevertPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border-2 border-[#EAD9B8] shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
              <Undo2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-[#2D1F0E]">
                Revert Scan for {confirmRevertPass.attendeeName}?
              </h3>
              <p className="text-xs text-[#6E5336] leading-relaxed">
                This will reset Pass <strong>{confirmRevertPass.passCode}</strong> ({confirmRevertPass.passType}) back to <strong>ACTIVE</strong> and delete the entry record. The attendee will be permitted to enter again.
              </p>
            </div>

            <div className="p-3 bg-[#FAF6EE] rounded-2xl border border-[#EAD9B8] text-left text-xs font-mono space-y-1">
              <div>Attendee: <strong>{confirmRevertPass.attendeeName}</strong></div>
              <div>Pass Code: <strong>{confirmRevertPass.passCode}</strong></div>
              <div>Registration: <strong>{confirmRevertPass.registrationNumber}</strong></div>
              <div>Scanned At: <strong>{confirmRevertPass.gateId.replace('_', ' ')}</strong></div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRevertPass(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRevertSingle(confirmRevertPass)}
                disabled={revertingId === confirmRevertPass.credentialId}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50"
              >
                {revertingId === confirmRevertPass.credentialId ? 'Reverting...' : 'Yes, Revert to Active'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET ALL SCANS CONFIRMATION MODAL */}
      {isResetAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border-2 border-red-200 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 border-2 border-rose-300 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-rose-950">
                Reset ALL {scannedPasses.length} Scanned Passes?
              </h3>
              <p className="text-xs text-[#6E5336] leading-relaxed">
                This will reset <strong>all {scannedPasses.length} currently scanned passes</strong> back to <strong>ACTIVE</strong> and reset the gate scanner counts back to 0. Use this after testing or to open access for tomorrow.
              </p>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-200 text-xs text-rose-900 font-semibold text-center">
              ⚠️ All {scannedPasses.length} attendees will be able to enter again tomorrow!
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetAllModalOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAllScans}
                disabled={resetAllLoading}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50"
              >
                {resetAllLoading ? 'Resetting All...' : `Yes, Reset All (${scannedPasses.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
