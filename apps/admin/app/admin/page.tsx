'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, getStoredUser } from '../../lib/api';
import { 
  Users, CreditCard, Ticket, Activity, Shield, FileText, AlertCircle, 
  RefreshCw, CheckCircle2, Crown, Eye, ThumbsUp, ThumbsDown, 
  Store, Building2, CheckSquare, Sparkles, DollarSign, Timer, Flame,
  EyeOff, Clock, Sliders, ArrowRight, MessageCircle, Phone, ExternalLink,
  Tag, MapPin, Settings
} from 'lucide-react';
import LogoSlot from '../components/LogoSlot';
import { AdvancedTabulatorTable, TabulatorColumn } from '../components/AdvancedTabulatorTable';
import { AadhaarDocumentPreview } from '../components/AadhaarDocumentPreview';
import { getMaintenanceMode, toggleMaintenanceMode } from '../actions/maintenance';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'attendees' | 'payments' | 'gazebos' | 'sponsors' | 'scans' | 'audit' | 'pricing' | 'settings'>('applications');
  
  const [overview, setOverview] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [gazebos, setGazebos] = useState<any[]>([]);
  const [gazeboInquiries, setGazeboInquiries] = useState<any[]>([]);
  const [sponsorInquiries, setSponsorInquiries] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);

  // Pricing & Urgency Control State
  const [pricingSettings, setPricingSettings] = useState<any>({
    phaseName: 'EARLY_BIRD',
    singlePrice: 3500,
    couplePrice: 6500,
    nextSinglePrice: 6500,
    nextCouplePrice: 12000,
    showSinglePrice: true,
    showCouplePrice: true,
    showGazeboPrice: false,
    isCountdownActive: true,
    countdownTarget: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    urgencyTagline: 'Early Bird Phase Ending Soon — Lock in Your Passes Before Price Hike!',
    hiddenPriceLabel: 'Price Revealed on Approval',
  });
  const [pricingSaving, setPricingSaving] = useState(false);

  // Filter Pill State for Applications
  const [appStatusFilter, setAppStatusFilter] = useState<string>('ALL');
  const [appPassTypeFilter, setAppPassTypeFilter] = useState<string>('ALL');

  // Review Modal State
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [attendeeDecisions, setAttendeeDecisions] = useState<Record<string, { status: 'APPROVED' | 'REJECTED'; notes: string }>>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Inquiry Action Details Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [inquiryType, setInquiryType] = useState<'sponsor' | 'gazebo' | null>(null);

  // Helper: Colored status badge for inquiry status
  function getInquiryStatusBadge(status: string) {
    const map: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800 border-blue-200',
      CONTACTED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      DISCUSSION: 'bg-purple-100 text-purple-800 border-purple-200',
      HOLD: 'bg-amber-100 text-amber-800 border-amber-300',
      APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      CONFIRMED: 'bg-teal-100 text-teal-800 border-teal-300',
      REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
      CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  }

  function openReviewModal(app: any) {
    setSelectedApp(app);
    setReviewNotes(app.reviewNotes || '');
    const initialDecisions: Record<string, { status: 'APPROVED' | 'REJECTED'; notes: string }> = {};
    (app.attendees || []).forEach((ra: any) => {
      const attId = ra.attendee?.id || ra.attendeeId;
      initialDecisions[attId] = {
        status: ra.status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
        notes: ra.reviewNotes || '',
      };
    });
    setAttendeeDecisions(initialDecisions);
  }

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
    getMaintenanceMode().then(setIsMaintenanceMode);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
        loadOverviewData(true);
        if (activeTab !== 'overview') {
          loadTabContent(activeTab, true);
        }
      }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, activeTab]);

  async function loadOverviewData(silent = false) {
    if (!silent) setLoading(true);
    setError('');
    const resOverview = await apiRequest('/reports/overview');
    if (resOverview.success) {
      setOverview(resOverview.data);
    } else if (resOverview.error?.code === 'UNAUTHORIZED') {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    const resApps = await apiRequest('/registrations');
    if (resApps.success) setApplications(resApps.data || []);

    const resGazebos = await apiRequest('/gazebos');
    if (resGazebos.success) setGazebos(resGazebos.data || []);

    if (!silent) setLoading(false);
  }

  async function loadTabContent(tab: string, silent = false) {
    setActiveTab(tab as any);
    if (!silent) {
      setMessage('');
      setError('');
    }

    if (tab === 'applications') {
      const res = await apiRequest('/registrations');
      if (res.success) setApplications(res.data || []);
    } else if (tab === 'attendees') {
      const res = await apiRequest('/attendees');
      if (res.success) setAttendees(res.data || []);
    } else if (tab === 'payments') {
      const res = await apiRequest('/payments');
      if (res.success) setPayments(res.data || []);
    } else if (tab === 'gazebos') {
      const resG = await apiRequest('/gazebos');
      if (resG.success) setGazebos(resG.data || []);
      const resInq = await apiRequest('/gazebos/inquiries');
      if (resInq.success) setGazeboInquiries(resInq.data || []);
    } else if (tab === 'sponsors') {
      const res = await apiRequest('/sponsor-inquiries');
      if (res.success) setSponsorInquiries(res.data || []);
    } else if (tab === 'scans') {
      const res = await apiRequest('/scan-attempts');
      if (res.success) setScans(res.data || []);
    } else if (tab === 'audit') {
      const res = await apiRequest('/audit');
      if (res.success) setAuditLogs(res.data || []);
    } else if (tab === 'pricing') {
      const res = await apiRequest('/registrations/active-phase');
      if (res.success && res.data) {
        setPricingSettings({
          ...res.data,
          countdownTarget: res.data.countdownTarget
            ? new Date(res.data.countdownTarget).toISOString().slice(0, 16)
            : '',
        });
      }
    }
  }

  async function handleSavePricingSettings(e: React.FormEvent) {
    e.preventDefault();
    setPricingSaving(true);
    setMessage('');
    setError('');

    const res = await apiRequest('/registrations/pricing-settings', {
      method: 'POST',
      body: JSON.stringify({
        ...pricingSettings,
        singlePrice: Number(pricingSettings.singlePrice),
        couplePrice: Number(pricingSettings.couplePrice),
        nextSinglePrice: pricingSettings.nextSinglePrice ? Number(pricingSettings.nextSinglePrice) : null,
        nextCouplePrice: pricingSettings.nextCouplePrice ? Number(pricingSettings.nextCouplePrice) : null,
      }),
    });

    if (res.success) {
      setMessage('✅ Pricing & Urgency Control Settings updated successfully! Live website updated.');
      if (res.data) {
        setPricingSettings({
          ...res.data,
          countdownTarget: res.data.countdownTarget
            ? new Date(res.data.countdownTarget).toISOString().slice(0, 16)
            : '',
        });
      }
    } else {
      setError(res.error?.message || 'Failed to update pricing settings');
    }
    setPricingSaving(false);
  }

  async function handleReviewSubmit() {
    if (!selectedApp) return;
    setActionLoading(true);
    setMessage('');
    setError('');

    const decisionsList = Object.entries(attendeeDecisions).map(([attId, val]) => ({
      attendeeId: attId,
      status: val.status,
      reviewNotes: val.notes || (val.status === 'REJECTED' ? (reviewNotes || 'Aadhaar verification rejected') : ''),
    }));

    const res = await apiRequest(`/registrations/${selectedApp.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        globalNotes: reviewNotes,
        attendeeDecisions: decisionsList,
      }),
    });

    if (res.success) {
      setMessage(`Review decision saved successfully! Application status: ${res.data?.registration?.status || 'UPDATED'}`);
      setSelectedApp(null);
      setReviewNotes('');
      setAttendeeDecisions({});
      loadOverviewData();
      const ref = await apiRequest('/registrations');
      if (ref.success) setApplications(ref.data || []);
    } else {
      setError(res.error?.message || 'Failed to submit review');
    }
    setActionLoading(false);
  }

  async function handleApprove(appId: string) {
    setActionLoading(true);
    setMessage('');
    setError('');
    const res = await apiRequest(`/registrations/${appId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes: reviewNotes || 'Approved by Super Admin' }),
    });

    if (res.success) {
      setMessage(`Application approved! Payment order activated.`);
      setSelectedApp(null);
      setReviewNotes('');
      loadOverviewData();
      const ref = await apiRequest('/registrations');
      if (ref.success) setApplications(ref.data || []);
    } else {
      setError(res.error?.message || 'Failed to approve application');
    }
    setActionLoading(false);
  }

  async function handleReject(appId: string) {
    if (!reviewNotes.trim()) {
      setError('Please provide a reason for rejecting the application.');
      return;
    }
    setActionLoading(true);
    setMessage('');
    setError('');
    const res = await apiRequest(`/registrations/${appId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes: reviewNotes }),
    });

    if (res.success) {
      setMessage('Application rejected.');
      setSelectedApp(null);
      setReviewNotes('');
      loadOverviewData();
      const ref = await apiRequest('/registrations');
      if (ref.success) setApplications(ref.data || []);
    } else {
      setError(res.error?.message || 'Failed to reject application');
    }
    setActionLoading(false);
  }

  async function handleBatchApprove(selectedRows: any[]) {
    if (!confirm(`Are you sure you want to approve ${selectedRows.length} application(s)?`)) return;
    setLoading(true);
    let approvedCount = 0;
    for (const app of selectedRows) {
      if (app.status === 'UNDER_REVIEW' || app.status === 'SUBMITTED') {
        const res = await apiRequest(`/registrations/${app.id}/approve`, {
          method: 'POST',
          body: JSON.stringify({ notes: 'Batch approved via Tabulator Table' }),
        });
        if (res.success) approvedCount++;
      }
    }
    setMessage(`Batch completed: ${approvedCount} application(s) approved.`);
    loadOverviewData();
    loadTabContent('applications');
  }

  async function handleUpdateInquiryStatus(id: string, type: 'sponsor' | 'gazebo', status: string) {
    setActionLoading(true);
    let endpoint = '';
    if (type === 'sponsor') endpoint = `/sponsor-inquiries/${id}/status`;
    if (type === 'gazebo') endpoint = `/gazebos/inquiries/${id}/status`;

    const res = await apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (res.success) {
      setMessage(`Status updated to ${status}.`);
      setSelectedInquiry(null);
      setInquiryType(null);
      loadTabContent(type + 's' as any);
    } else {
      setError(res.error?.message || 'Failed to update status.');
    }
    setActionLoading(false);
  }

  // Filtered applications for custom filter component
  const filteredApps = applications.filter((app) => {
    if (appStatusFilter !== 'ALL' && app.status !== appStatusFilter) return false;
    if (appPassTypeFilter !== 'ALL' && app.passType !== appPassTypeFilter) return false;
    return true;
  });

  // =========================================================================
  // TABULATOR COLUMN DEFINITIONS
  // =========================================================================

  // 1. Applications Columns
  const applicationColumns: TabulatorColumn<any>[] = [
    {
      key: 'registrationNumber',
      title: 'Application #',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-[#2D1F0E]">{row.registrationNumber}</span>,
    },
    {
      key: 'passType',
      title: 'Pass Category',
      sortable: true,
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          row.passType === 'SINGLE'
            ? 'bg-purple-100 text-purple-800'
            : row.passType === 'COUPLE'
            ? 'bg-[#FFF5DC] text-[#8C6019] border border-[#E5A93C]'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {row.passType}
        </span>
      ),
    },
    {
      key: 'primaryAttendee',
      title: 'Primary Attendee',
      sortable: true,
      getValue: (row) => row.attendees?.[0]?.attendee?.fullName || '',
      render: (row) => {
        const primary = row.attendees?.[0]?.attendee;
        return (
          <div>
            <div className="font-semibold text-[#2D1F0E]">{primary?.fullName || '—'}</div>
            <div className="text-[10px] text-[#6E5336]">
              {row.passType === 'SINGLE' && primary?.gender === 'FEMALE' ? 'SINGLE FEMALE' : primary?.gender}
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      title: 'WhatsApp Phone',
      sortable: true,
      getValue: (row) => row.attendees?.[0]?.attendee?.phone || '',
      render: (row) => <span className="font-mono text-[#6E5336]">{row.attendees?.[0]?.attendee?.phone || '—'}</span>,
    },
    {
      key: 'aadhaarMasked',
      title: 'Masked Aadhaar',
      sortable: true,
      getValue: (row) => row.attendees?.[0]?.attendee?.aadhaarMasked || '',
      render: (row) => <span className="font-mono text-[#6E5336]">{row.attendees?.[0]?.attendee?.aadhaarMasked || '—'}</span>,
    },
    {
      key: 'amountDue',
      title: 'Amount (₹)',
      sortable: true,
      isNumeric: true,
      align: 'right',
      getValue: (row) => Number(row.amountDue || 0),
      render: (row) => (
        <span className="font-serif font-bold text-emerald-800">
          ₹{Number(row.amountDue)?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          row.status === 'PASS_ISSUED' || row.status === 'PAYMENT_CONFIRMED'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : row.status === 'PAYMENT_PENDING' || row.status === 'APPROVED'
            ? 'bg-amber-100 text-amber-800 border border-amber-300'
            : row.status === 'UNDER_REVIEW' || row.status === 'SUBMITTED'
            ? 'bg-blue-100 text-blue-800 border border-blue-300'
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Submission Date',
      sortable: true,
      getValue: (row) => new Date(row.createdAt).toISOString(),
      render: (row) => (
        <span className="text-[#6E5336] font-mono text-[11px]">
          {new Date(row.createdAt).toLocaleDateString()} {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Action',
      sortable: false,
      align: 'right',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openReviewModal(row);
          }}
          className="px-3 py-1 rounded-xl bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] font-semibold text-[11px] inline-flex items-center space-x-1 transition shadow-sm"
        >
          <Eye className="w-3 h-3 text-[#D99427]" />
          <span>Review</span>
        </button>
      ),
    },
  ];

  // 2. Verified Attendees Columns
  const attendeeColumns: TabulatorColumn<any>[] = [
    { key: 'fullName', title: 'Attendee Name', sortable: true, render: (r) => <strong className="text-[#2D1F0E]">{r.fullName}</strong> },
    {
      key: 'gender',
      title: 'Gender',
      sortable: true,
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.gender === 'FEMALE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
          {r.gender}
        </span>
      ),
    },
    { key: 'phone', title: 'WhatsApp Phone', sortable: true, render: (r) => <span className="font-mono">{r.phone}</span> },
    { key: 'aadhaarMasked', title: 'Masked Aadhaar', sortable: true, render: (r) => <span className="font-mono">{r.aadhaarMasked}</span> },
    {
      key: 'passCode',
      title: 'Active Pass Code',
      sortable: true,
      getValue: (r) => r.credentials?.[0]?.passCode || '',
      render: (r) => <span className="font-mono font-bold text-[#D99427]">{r.credentials?.[0]?.passCode || '—'}</span>,
    },
    {
      key: 'registrationNumber',
      title: 'Booking #',
      sortable: true,
      getValue: (r) => r.registrations?.[0]?.registration?.registrationNumber || '',
      render: (r) => <span className="font-mono text-[#6E5336]">{r.registrations?.[0]?.registration?.registrationNumber || '—'}</span>,
    },
    {
      key: 'createdAt',
      title: 'Registered Date',
      sortable: true,
      getValue: (r) => new Date(r.createdAt).toISOString(),
      render: (r) => <span className="font-mono text-[11px] text-[#6E5336]">{new Date(r.createdAt).toLocaleDateString()}</span>,
    },
  ];

  // 3. Payments Ledger Columns
  const paymentColumns: TabulatorColumn<any>[] = [
    { key: 'receiptNumber', title: 'Receipt #', sortable: true, render: (r) => <strong className="font-mono text-[#2D1F0E]">{r.receiptNumber}</strong> },
    {
      key: 'registrationNumber',
      title: 'Application #',
      sortable: true,
      getValue: (r) => r.registration?.registrationNumber || '',
      render: (r) => <span className="font-mono">{r.registration?.registrationNumber || '—'}</span>,
    },
    {
      key: 'amount',
      title: 'Amount (₹)',
      sortable: true,
      isNumeric: true,
      align: 'right',
      getValue: (r) => Number(r.amount || 0),
      render: (r) => <span className="font-serif font-bold text-emerald-700 text-sm">₹{Number(r.amount)?.toLocaleString()}</span>,
    },
    {
      key: 'method',
      title: 'Payment Method',
      sortable: true,
      render: (r) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          r.method === 'UPI_QR' ? 'bg-amber-100 text-amber-800' : r.method === 'ONLINE_GATEWAY' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {r.method}
        </span>
      ),
    },
    { key: 'providerReference', title: 'Gateway Ref / TXN', sortable: true, render: (r) => <span className="font-mono text-[11px] text-[#6E5336]">{r.providerReference || '—'}</span> },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (r) => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{r.status}</span>,
    },
    {
      key: 'createdAt',
      title: 'Payment Timestamp',
      sortable: true,
      getValue: (r) => new Date(r.createdAt).toISOString(),
      render: (r) => <span className="font-mono text-[11px] text-[#6E5336]">{new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-[#2D1F0E]">
      {/* HEADER & BRAND */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAD9B8] pb-6">
        <div className="flex items-center space-x-4">
          <LogoSlot size="md" />
          <div>
            <span className="text-[11px] font-mono tracking-[0.25em] font-bold text-[#8C6019] uppercase block mb-1">
              EXECUTIVE OPERATIONS & TABULATOR SUITE
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F0E] tracking-tight">
              Safed Sheri 2026 Admin Terminal
            </h1>
            <p className="text-xs text-[#6E5336] mt-0.5">
              Tabulator Table • Excel (.xlsx) & CSV Export • Multi-column Search • Bulk Actions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => { loadOverviewData(); loadTabContent(activeTab); }}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8F5EE] border border-[#EAD9B8] text-xs font-bold text-[#2D1F0E] flex items-center space-x-2 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D99427] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
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

      {/* TOP OPERATIONAL KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#EAD9B8] shadow-sm">
          <div className="text-[#6E5336] text-[11px] uppercase tracking-wider font-semibold mb-1">Total Bookings</div>
          <div className="text-2xl font-serif font-bold text-[#2D1F0E]">
            {overview?.applications?.total || applications.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm">
          <div className="text-blue-700 text-[11px] uppercase tracking-wider font-semibold mb-1">Under Review</div>
          <div className="text-2xl font-serif font-bold text-blue-950">
            {overview?.applications?.pendingReview || applications.filter(a => a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED').length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFF9EE] border border-[#E5A93C] shadow-sm">
          <div className="text-[#8C6019] text-[11px] uppercase tracking-wider font-semibold mb-1">Payment Pending</div>
          <div className="text-2xl font-serif font-bold text-[#2D1F0E]">
            {overview?.applications?.paymentPending || applications.filter(a => a.status === 'PAYMENT_PENDING').length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
          <div className="text-emerald-700 text-[11px] uppercase tracking-wider font-semibold mb-1">Passes Issued</div>
          <div className="text-2xl font-serif font-bold text-emerald-950">
            {overview?.applications?.passesIssued || applications.filter(a => a.status === 'PASS_ISSUED').length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FFF5DC] to-[#FAF6EE] border border-[#D99427] shadow-sm">
          <div className="text-[#8C6019] text-[11px] uppercase tracking-wider font-bold mb-1">Total Collection</div>
          <div className="text-2xl font-serif font-bold text-[#2D1F0E]">
            ₹{overview?.financials?.totalCollection?.toLocaleString() || '0'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 shadow-sm">
          <div className="text-purple-700 text-[11px] uppercase tracking-wider font-semibold mb-1">Gate Entries</div>
          <div className="text-2xl font-serif font-bold text-purple-950">
            {overview?.entries?.total || '0'}
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-[#EAD9B8] space-x-2 overflow-x-auto pb-2 text-xs font-semibold">
        {[
          { id: 'applications', label: 'Applications Tabulator', icon: Ticket },
          { id: 'attendees', label: 'Verified Attendees', icon: Users },
          { id: 'payments', label: 'Payment Ledger', icon: CreditCard },
          { id: 'pricing', label: 'Pricing & Urgency Control', icon: Timer },
          { id: 'gazebos', label: 'Gazebos (VIP)', icon: Crown },
          { id: 'sponsors', label: 'Sponsors & Brands', icon: Building2 },
          { id: 'scans', label: 'Security Scans', icon: Shield },
          { id: 'audit', label: 'Audit Log', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => loadTabContent(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-[#2D1F0E] text-white font-bold shadow-md'
                  : 'text-[#6E5336] hover:bg-[#F8F5EE] hover:text-[#2D1F0E]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-[#D99427]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: APPLICATIONS TABULATOR TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <AdvancedTabulatorTable
          data={filteredApps}
          columns={applicationColumns}
          keyField="id"
          title="Guest Registrations & Booking Applications"
          subtitle="Real-time Tabulator Grid • Export to Excel (.xlsx) & CSV • Column Visibility & Per-Column Filter"
          defaultPageSize={10}
          onRefresh={() => loadTabContent('applications')}
          isLoading={loading}
          batchActions={[
            {
              label: 'Batch Approve Selected',
              icon: <CheckSquare className="w-3.5 h-3.5" />,
              variant: 'primary',
              action: (selected) => handleBatchApprove(selected),
            },
          ]}
          customFilterComponent={
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#8C6019]">Filter by Status:</span>
                <div className="flex space-x-1 bg-[#FAF6EE] p-1 rounded-2xl border border-[#EAD9B8]">
                  {['ALL', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'PASS_ISSUED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setAppStatusFilter(st)}
                      className={`px-3 py-1 rounded-xl font-bold transition text-[11px] ${
                        appStatusFilter === st
                          ? 'bg-[#D99427] text-white shadow-sm'
                          : 'text-[#6E5336] hover:bg-[#F3ECE0]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#8C6019]">Category:</span>
                <select
                  value={appPassTypeFilter}
                  onChange={(e) => setAppPassTypeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-semibold focus:border-[#D99427] outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SINGLE">Single Pass</option>
                  <option value="COUPLE">Couple Pass</option>
                  <option value="GAZEBO">Gazebo VIP</option>
                </select>
              </div>
            </div>
          }
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VERIFIED ATTENDEES TABULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'attendees' && (
        <AdvancedTabulatorTable
          data={attendees}
          columns={attendeeColumns}
          keyField="id"
          title="Verified Attendee Registry"
          subtitle="Government ID Verified Attendees • Pass Codes • Exportable Dataset"
          defaultPageSize={10}
          onRefresh={() => loadTabContent('attendees')}
          isLoading={loading}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENTS LEDGER TABULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <AdvancedTabulatorTable
          data={payments}
          columns={paymentColumns}
          keyField="id"
          title="Financial Ledger & Payment Receipts"
          subtitle="100% Online UPI & Gateway Settlements • Instant Excel & CSV Generation"
          defaultPageSize={10}
          onRefresh={() => loadTabContent('payments')}
          isLoading={loading}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GAZEBOS & INQUIRIES */}
      {/* ========================================================================= */}
      {activeTab === 'gazebos' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {gazebos.map((gz) => (
              <div key={gz.id} className="p-6 rounded-3xl bg-white border border-[#EAD9B8] shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C6019]">
                    LEVEL {gz.level}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    gz.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {gz.status}
                  </span>
                </div>
                <h4 className="text-xl font-serif font-bold text-[#2D1F0E]">{gz.name}</h4>
                <div className="text-xs text-[#6E5336]">Capacity: {gz.capacity} VIP Guests</div>
                <div className="text-xs font-serif font-bold text-[#D99427]">
                  Level {gz.level} Spatial Cabana (Inquiry Only)
                </div>
              </div>
            ))}
          </div>

          <AdvancedTabulatorTable
            data={gazeboInquiries}
            columns={[
              { key: 'inquiryNumber', title: 'Ref #', sortable: true, render: (r) => <span className="font-mono text-[11px] text-[#8C6019] font-bold">{r.inquiryNumber || '—'}</span> },
              { key: 'fullName', title: 'Host Name', sortable: true, render: (r) => <strong className="text-[#2D1F0E]">{r.fullName}</strong> },
              { key: 'phone', title: 'WhatsApp', sortable: true, render: (r) => <span className="font-mono text-xs">{r.phone}</span> },
              { key: 'level', title: 'Level', sortable: true, render: (r) => (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF5DC] text-[#8C6019] border border-[#EAD9B8]">
                  Level {r.level}
                </span>
              )},
              { key: 'status', title: 'Status', sortable: true, render: (r) => (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getInquiryStatusBadge(r.status)}`}>
                  {r.status}
                </span>
              )},
              { key: 'createdAt', title: 'Date', sortable: true, render: (r) => <span className="text-[11px] text-[#6E5336]">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span> },
              { key: 'actions', title: 'Actions', sortable: false, align: 'right', render: (r) => (
                  <button
                    onClick={() => { setSelectedInquiry(r); setInquiryType('gazebo'); }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FFF5DC] to-[#FAF6EE] border border-[#EAD9B8] text-[11px] font-bold text-[#8C6019] hover:border-[#D99427] transition shadow-sm"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View & Act</span>
                  </button>
                ) 
              }
            ]}
            keyField="id"
            title="VIP Gazebo Inquiries"
            subtitle="Concierge inquiries tracking"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SPONSORS & BRANDS */}
      {/* ========================================================================= */}
      {activeTab === 'sponsors' && (
        <AdvancedTabulatorTable
          data={sponsorInquiries}
          columns={[
            { key: 'companyName', title: 'Company Name', sortable: true, render: (r) => <strong className="text-[#2D1F0E]">{r.companyName}</strong> },
            { key: 'contactName', title: 'Contact Person', sortable: true, render: (r) => <span>{r.contactName}</span> },
            { key: 'phone', title: 'Phone', sortable: true, render: (r) => <span className="font-mono text-xs">{r.phone}</span> },
            { key: 'sponsorshipType', title: 'Tier', sortable: true, render: (r) => (
              <span className="text-[11px] text-[#6E5336] truncate max-w-[180px] block">{r.sponsorshipType?.split('(')[0]?.trim() || '—'}</span>
            )},
            { key: 'status', title: 'Status', sortable: true, render: (r) => (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getInquiryStatusBadge(r.status)}`}>
                {r.status}
              </span>
            )},
            { key: 'createdAt', title: 'Date', sortable: true, render: (r) => <span className="text-[11px] text-[#6E5336]">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span> },
            { key: 'actions', title: 'Actions', sortable: false, align: 'right', render: (r) => (
                <button
                  onClick={() => { setSelectedInquiry(r); setInquiryType('sponsor'); }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FFF5DC] to-[#FAF6EE] border border-[#EAD9B8] text-[11px] font-bold text-[#8C6019] hover:border-[#D99427] transition shadow-sm"
                >
                  <Eye className="w-3 h-3" />
                  <span>View & Act</span>
                </button>
              ) 
            }
          ]}
          keyField="id"
          title="Corporate Brand & Sponsor Inquiries"
          subtitle="Corporate partnerships tracker"
        />
      )}


      {/* ========================================================================= */}
      {/* TAB 7: PRICING & URGENCY CONTROL TERMINAL */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-6 animate-fade-in">
          {/* HEADER BANNER */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FFF5DC] via-[#FAF6EE] to-[#FFF9EE] border-2 border-[#D99427]/40 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-[10px] font-mono tracking-widest font-bold text-[#8C6019] uppercase mb-1">
                <Flame className="w-3.5 h-3.5 text-[#D99427]" />
                <span>DYNAMIC PRICING & URGENCY ENGINE</span>
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#2D1F0E]">
                Public Pricing Visibility & Reverse Countdown Manager
              </h2>
              <p className="text-xs text-[#6E5336] mt-1 max-w-xl">
                Control which prices are displayed on the public landing page, conceal amounts behind exclusive luxury badges, and configure real-time urgency countdown stop watches to drive immediate pass conversions.
              </p>
            </div>

            {/* QUICK PRESETS */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPricingSettings((prev: any) => ({
                    ...prev,
                    phaseName: 'EARLY_BIRD',
                    singlePrice: 3500,
                    couplePrice: 6500,
                    nextSinglePrice: 6500,
                    nextCouplePrice: 12000,
                    showSinglePrice: true,
                    showCouplePrice: true,
                    isCountdownActive: true,
                    urgencyTagline: '⚡ Early Bird Phase Ending Soon — Lock in passes at ₹3,500 before price escalates to ₹6,500!',
                  }));
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold transition flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-[#D99427]" />
                <span>Preset: Early Bird Flash Sale</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPricingSettings((prev: any) => ({
                    ...prev,
                    phaseName: 'PRIVATE_TIER',
                    showSinglePrice: false,
                    showCouplePrice: false,
                    showGazeboPrice: false,
                    hiddenPriceLabel: 'Price Revealed on Approval',
                    isCountdownActive: false,
                  }));
                }}
                className="px-3 py-1.5 rounded-xl bg-[#2D1F0E] hover:bg-[#3D2B14] text-[#F6C85F] text-[11px] font-bold transition flex items-center space-x-1"
              >
                <EyeOff className="w-3 h-3 text-[#F6C85F]" />
                <span>Preset: 100% Concealed Amounts</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSavePricingSettings} className="space-y-6">
            {/* 3-COLUMN CONTROL GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CARD 1: PUBLIC PRICE VISIBILITY */}
              <div className="p-6 rounded-3xl bg-white border border-[#EAD9B8] shadow-sm space-y-5">
                <div className="flex items-center space-x-2 border-b border-[#EAD9B8] pb-3">
                  <Eye className="w-4 h-4 text-[#D99427]" />
                  <h3 className="text-sm font-serif font-bold text-[#2D1F0E]">Public Amount Visibility</h3>
                </div>

                <div className="space-y-4">
                  {/* Single Pass Toggle */}
                  <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#2D1F0E]">Single Pass Price</div>
                      <div className="text-[11px] text-[#6E5336]">
                        {pricingSettings.showSinglePrice ? `Showing ₹${pricingSettings.singlePrice?.toLocaleString()} to public` : `Concealed • Showing luxury badge`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPricingSettings({ ...pricingSettings, showSinglePrice: !pricingSettings.showSinglePrice })}
                      className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                        pricingSettings.showSinglePrice ? 'bg-[#D99427] justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Couple Pass Toggle */}
                  <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#2D1F0E]">Couple Pass Price</div>
                      <div className="text-[11px] text-[#6E5336]">
                        {pricingSettings.showCouplePrice ? `Showing ₹${pricingSettings.couplePrice?.toLocaleString()} to public` : `Concealed • Showing luxury badge`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPricingSettings({ ...pricingSettings, showCouplePrice: !pricingSettings.showCouplePrice })}
                      className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                        pricingSettings.showCouplePrice ? 'bg-[#D99427] justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Gazebo Pass Toggle */}
                  <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#2D1F0E]">VIP Gazebos Price</div>
                      <div className="text-[11px] text-[#6E5336]">
                        {pricingSettings.showGazeboPrice ? `Showing custom tier pricing` : `Concealed • VIP Concierge Inquiry`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPricingSettings({ ...pricingSettings, showGazeboPrice: !pricingSettings.showGazeboPrice })}
                      className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                        pricingSettings.showGazeboPrice ? 'bg-[#D99427] justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  {/* Hidden Price Badge Text */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">
                      Concealed Price Badge Text (Shown when price is hidden)
                    </label>
                    <input
                      type="text"
                      value={pricingSettings.hiddenPriceLabel || ''}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, hiddenPriceLabel: e.target.value })}
                      placeholder="e.g. Price Revealed on Approval"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-medium focus:border-[#D99427] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: CURRENT & NEXT PHASE PRICING */}
              <div className="p-6 rounded-3xl bg-white border border-[#EAD9B8] shadow-sm space-y-5">
                <div className="flex items-center space-x-2 border-b border-[#EAD9B8] pb-3">
                  <DollarSign className="w-4 h-4 text-[#D99427]" />
                  <h3 className="text-sm font-serif font-bold text-[#2D1F0E]">Phase Rates & Escalation</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Active Phase Name</label>
                    <input
                      type="text"
                      required
                      value={pricingSettings.phaseName || ''}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, phaseName: e.target.value })}
                      placeholder="e.g. EARLY_BIRD, REGULAR, FINAL_CALL"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-mono font-bold uppercase focus:border-[#D99427] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Single Pass Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={pricingSettings.singlePrice || 0}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, singlePrice: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-mono font-bold focus:border-[#D99427] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 mb-1">Next Phase Single (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings.nextSinglePrice || ''}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, nextSinglePrice: Number(e.target.value) })}
                        placeholder="e.g. 6500"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/50 border border-amber-300 text-amber-950 text-xs font-mono font-bold focus:border-[#D99427] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Couple Pass Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={pricingSettings.couplePrice || 0}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, couplePrice: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-mono font-bold focus:border-[#D99427] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 mb-1">Next Phase Couple (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={pricingSettings.nextCouplePrice || ''}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, nextCouplePrice: Number(e.target.value) })}
                        placeholder="e.g. 12000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/50 border border-amber-300 text-amber-950 text-xs font-mono font-bold focus:border-[#D99427] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: URGENCY REVERSE COUNTDOWN STOP WATCH */}
              <div className="p-6 rounded-3xl bg-white border border-[#EAD9B8] shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#EAD9B8] pb-3">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-[#D99427]" />
                    <h3 className="text-sm font-serif font-bold text-[#2D1F0E]">Urgency Reverse Stop Watch</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPricingSettings({ ...pricingSettings, isCountdownActive: !pricingSettings.isCountdownActive })}
                    className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                      pricingSettings.isCountdownActive ? 'bg-[#D99427] justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Countdown Expiry Target (Date & Time)</label>
                    <input
                      type="datetime-local"
                      value={pricingSettings.countdownTarget || ''}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, countdownTarget: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-mono focus:border-[#D99427] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Urgency Banner Headline</label>
                    <textarea
                      rows={2}
                      value={pricingSettings.urgencyTagline || ''}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, urgencyTagline: e.target.value })}
                      placeholder="e.g. Early Bird Phase Ending Soon — Lock in passes before price escalates!"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none resize-none"
                    />
                  </div>

                  {/* PREVIEW OF COUNTDOWN TICKER */}
                  {pricingSettings.isCountdownActive && (
                    <div className="p-3.5 rounded-2xl bg-[#2D1F0E] text-white border border-[#D99427]/40 space-y-2">
                      <div className="text-[10px] font-mono tracking-widest text-[#F6C85F] uppercase flex items-center justify-between">
                        <span>LIVE PUBLIC PREVIEW</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="flex items-center justify-around font-mono text-xs font-bold text-white">
                        <div className="text-center"><span className="text-lg font-serif text-[#F6C85F]">03</span>d</div>
                        <span>:</span>
                        <div className="text-center"><span className="text-lg font-serif text-[#F6C85F]">18</span>h</div>
                        <span>:</span>
                        <div className="text-center"><span className="text-lg font-serif text-[#F6C85F]">45</span>m</div>
                        <span>:</span>
                        <div className="text-center"><span className="text-lg font-serif text-[#F6C85F]">20</span>s</div>
                      </div>
                      <div className="text-[10px] text-[#EAD9B8] text-center truncate">
                        {pricingSettings.urgencyTagline || 'Phase ending soon'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#EAD9B8]">
              <button
                type="submit"
                disabled={pricingSaving}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 transition shadow-lg shadow-[#D99427]/30 flex items-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{pricingSaving ? 'Publishing Live Changes...' : 'Save & Publish Pricing Engine'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: SECURITY SCANS */}
      {/* ========================================================================= */}
      {activeTab === 'scans' && (
        <AdvancedTabulatorTable
          data={scans}
          columns={[
            { key: 'id', title: 'Scan ID', sortable: true, render: (r) => <span className="font-mono text-[11px]">{r.id.slice(0, 8)}...</span> },
            { key: 'status', title: 'Result', sortable: true, render: (r) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{r.status}</span> },
            { key: 'reason', title: 'Scan Verdict Details', sortable: true, render: (r) => <span>{r.reason || 'Verified Entry'}</span> },
            { key: 'createdAt', title: 'Timestamp', sortable: true, getValue: (r) => new Date(r.createdAt).toISOString(), render: (r) => <span className="font-mono text-[11px] text-[#6E5336]">{new Date(r.createdAt).toLocaleString()}</span> },
          ]}
          keyField="id"
          title="Security Gate Scanner Verification Log"
          subtitle="Real-time access logs and anti-passback duplicate attempts"
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 9: AUDIT LOG */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <AdvancedTabulatorTable
          data={auditLogs}
          columns={[
            { key: 'action', title: 'Action Performed', sortable: true, render: (r) => <strong className="font-mono text-xs">{r.action}</strong> },
            { key: 'targetEntity', title: 'Target Entity', sortable: true },
            { key: 'targetId', title: 'Entity ID', sortable: true, render: (r) => <span className="font-mono text-[11px]">{r.targetId || '—'}</span> },
            { key: 'createdAt', title: 'Timestamp', sortable: true, getValue: (r) => new Date(r.createdAt).toISOString(), render: (r) => <span className="font-mono text-[11px] text-[#6E5336]">{new Date(r.createdAt).toLocaleString()}</span> },
          ]}
          keyField="id"
          title="Super Admin Audit & Change Trail"
          subtitle="Immutable operational security log"
        />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#2D1F0E] text-[#FDFBF7] p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-serif text-[#D99427] mb-2 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  Global Maintenance Mode
                </h2>
                <p className="text-sm text-[#A3927B] max-w-xl">
                  Force the public-facing landing page into a premium 500 error screen. 
                  This will block all traffic from accessing the application while you work on updates. 
                  The admin dashboard will remain fully accessible to you.
                </p>
              </div>
              <button
                onClick={async () => {
                  const newState = await toggleMaintenanceMode(isMaintenanceMode);
                  setIsMaintenanceMode(newState);
                }}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${isMaintenanceMode ? 'bg-[#D99427]' : 'bg-[#6E5336]'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isMaintenanceMode ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GRANULAR PER-ATTENDEE DECISION APPLICATION REVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-[#EAD9B8] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative space-y-6 text-[#2D1F0E]">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F8F5EE] text-[#6E5336] hover:text-[#2D1F0E] flex items-center justify-center border border-[#EAD9B8] font-bold"
            >
              ✕
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-widest block">
                  EXECUTIVE KYC APPLICATION REVIEW
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FAF6EE] text-[#8C6019] border border-[#EAD9B8]">
                  {selectedApp.attendees?.length} {selectedApp.attendees?.length === 1 ? 'Guest' : 'Guests'} Total
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">
                Application #{selectedApp.registrationNumber}
              </h3>
              <p className="text-xs text-[#6E5336] mt-1">
                Pass Category: <strong>{selectedApp.passType}</strong> • Original Amount: <strong>₹{Number(selectedApp.amountDue)?.toLocaleString()}</strong> • Status: <strong>{selectedApp.status}</strong>
              </p>
            </div>

            {/* Quick Batch Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8]">
              <span className="text-xs font-bold text-[#8C6019] flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Quick Bulk Select:</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const allApp: Record<string, { status: 'APPROVED' | 'REJECTED'; notes: string }> = {};
                    selectedApp.attendees?.forEach((ra: any) => {
                      const attId = ra.attendee?.id || ra.attendeeId;
                      allApp[attId] = { status: 'APPROVED', notes: '' };
                    });
                    setAttendeeDecisions(allApp);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 text-[11px] font-bold flex items-center space-x-1 transition shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve All ({selectedApp.attendees?.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const allRej: Record<string, { status: 'APPROVED' | 'REJECTED'; notes: string }> = {};
                    selectedApp.attendees?.forEach((ra: any) => {
                      const attId = ra.attendee?.id || ra.attendeeId;
                      allRej[attId] = { status: 'REJECTED', notes: reviewNotes || 'Aadhaar document verification failed' };
                    });
                    setAttendeeDecisions(allRej);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 text-[11px] font-bold flex items-center space-x-1 transition shadow-sm"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Reject All ({selectedApp.attendees?.length})</span>
                </button>
              </div>
            </div>

            {/* Granular Per-Attendee Cards */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#2D1F0E] tracking-wider uppercase flex items-center justify-between">
                <span>Attendee Document Verification & Individual Decision</span>
                <span className="text-[11px] text-[#8C6019] font-normal">
                  (Reject blurry or incomplete IDs without canceling the rest of the squad)
                </span>
              </div>

              {selectedApp.attendees?.map((regAtt: any, idx: number) => {
                const att = regAtt.attendee;
                const decision = attendeeDecisions[att.id] || { status: 'APPROVED', notes: '' };
                const isApproved = decision.status === 'APPROVED';

                return (
                  <div
                    key={att.id}
                    className={`p-5 rounded-2xl border transition space-y-4 shadow-sm ${
                      isApproved
                        ? 'bg-white border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                    }`}
                  >
                    {/* Attendee Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAD9B8]/50 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-mono font-bold text-[#8C6019] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-[#2D1F0E] text-sm">
                            {att.fullName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FAF6EE] text-[#8C6019] border border-[#EAD9B8]">
                            {selectedApp.passType === 'SINGLE' && att.gender === 'FEMALE' ? 'SINGLE FEMALE' : att.gender}
                          </span>
                          {regAtt.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                              Primary Contact
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#6E5336] font-mono mt-1 flex items-center space-x-3">
                          <span>Aadhaar: <strong>{att.aadhaarMasked}</strong></span>
                          <span>•</span>
                          <span>WhatsApp: <strong>+91 {att.phone}</strong></span>
                        </div>
                      </div>

                      {/* Granular Approve / Reject Toggle Switch */}
                      <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-[#EAD9B8]">
                        <button
                          type="button"
                          onClick={() => {
                            setAttendeeDecisions({
                              ...attendeeDecisions,
                              [att.id]: { status: 'APPROVED', notes: '' },
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                            isApproved
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAttendeeDecisions({
                              ...attendeeDecisions,
                              [att.id]: {
                                status: 'REJECTED',
                                notes: decision.notes || 'Aadhar number is not proper visible',
                              },
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                            !isApproved
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'text-gray-500 hover:text-red-700 hover:bg-red-50'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {/* Aadhaar Document Preview */}
                    {att.document ? (
                      <AadhaarDocumentPreview
                        document={att.document}
                        token={getAuthToken() || ''}
                      />
                    ) : (
                      <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                        No physical document record attached.
                      </div>
                    )}

                    {/* Specific Rejection Reason Box */}
                    {!isApproved && (
                      <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-2">
                        <label className="block text-[11px] font-bold text-rose-900">
                          Rejection Reason for {att.fullName} (Shown to guest in wallet):
                        </label>
                        <input
                          type="text"
                          value={decision.notes}
                          onChange={(e) => {
                            setAttendeeDecisions({
                              ...attendeeDecisions,
                              [att.id]: { status: 'REJECTED', notes: e.target.value },
                            });
                          }}
                          placeholder="e.g. Aadhar number is not proper visible"
                          className="w-full px-3 py-2 rounded-lg bg-rose-50/50 border border-rose-300 text-rose-950 text-xs focus:border-red-500 outline-none"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-gray-500 font-bold">Quick presets:</span>
                          {[
                            'Aadhar number is not proper visible',
                            'Blurry document photo',
                            'Name mismatch with application',
                            'Photo cropped / missing address',
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setAttendeeDecisions({
                                  ...attendeeDecisions,
                                  [att.id]: { status: 'REJECTED', notes: preset },
                                });
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 transition"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Verdict Summary & Submission Card */}
            {(() => {
              const totalGuests = selectedApp.attendees?.length || 0;
              const approvedCount = Object.values(attendeeDecisions).filter((d) => d.status === 'APPROVED').length;
              const rejectedCount = totalGuests - approvedCount;
              const singlePrice = Number(selectedApp.pricingPhase?.singlePrice || 3500);
              const recalculatedAmount =
                selectedApp.passType === 'COUPLE'
                  ? Number(selectedApp.amountDue)
                  : selectedApp.passType === 'KIDS'
                  ? (selectedApp.attendees as any[]).reduce((sum: number, attWrapper: any) => {
                      if (attendeeDecisions[attWrapper.attendee.id]?.status === 'APPROVED') {
                        if (attWrapper.attendee.dob) {
                          const diffMs = Date.now() - new Date(attWrapper.attendee.dob).getTime();
                          const age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
                          if (age >= 10 && age <= 15) return sum + 1200;
                          return sum; // Free below 10
                        }
                        return sum; // Fallback
                      }
                      return sum;
                    }, 0)
                  : singlePrice * approvedCount;

              return (
                <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] space-y-4">
                  {/* Verdict Calculation Bar */}
                  <div className="p-4 rounded-xl bg-white border border-[#EAD9B8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-[#2D1F0E] flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#D99427]" />
                        <span>Review Verdict: {approvedCount} Approved, {rejectedCount} Rejected</span>
                      </div>
                      <div className="text-[11px] text-[#6E5336]">
                        {approvedCount === 0
                          ? 'All guest profiles rejected. Application will be marked as REJECTED.'
                          : rejectedCount > 0
                          ? `Partial Approval: Payment link activated for ${approvedCount} approved pass(es). Rejected guests can re-apply independently.`
                          : 'Full Approval: All attendees verified. Payment link activated for total batch.'}
                      </div>
                    </div>
                    {approvedCount > 0 && (
                      <div className="text-right font-serif">
                        <div className="text-[10px] text-[#8C6019] uppercase font-bold">Payable Amount</div>
                        <div className="text-xl font-bold text-emerald-800">₹{recalculatedAmount.toLocaleString()}</div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D1F0E] mb-1">Global Executive Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="e.g. Verified valid attendees. Approved for payment."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedApp(null)}
                      className="px-5 py-2.5 rounded-full bg-white text-[#6E5336] border border-[#EAD9B8] hover:bg-[#F8F5EE] text-xs font-bold uppercase tracking-wider transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleReviewSubmit}
                      disabled={actionLoading}
                      className="px-7 py-3 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] hover:opacity-95 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition disabled:opacity-50 shadow-md shadow-[#D99427]/30"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#2D1F0E]" />
                      <span>
                        {actionLoading
                          ? 'Submitting Verdict...'
                          : approvedCount === 0
                          ? 'Submit Rejection'
                          : `Submit Review (${approvedCount} Approved, ${rejectedCount} Rejected)`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INQUIRY ACTION DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedInquiry && inquiryType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-[#FFFDF9] border-2 border-[#EAD9B8] rounded-[2.5rem] w-full max-w-2xl p-6 md:p-8 shadow-2xl relative text-[#2D1F0E] my-auto">
            <button
              onClick={() => {
                setSelectedInquiry(null);
                setInquiryType(null);
              }}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F8F5EE] text-[#6E5336] hover:text-[#2D1F0E] flex items-center justify-center border border-[#EAD9B8]"
            >
              ✕
            </button>
            <div className="space-y-6">
              {/* Modal Header */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-[#8C6019] uppercase font-bold">
                    {inquiryType === 'sponsor' ? '🏢 SPONSOR' : '🏛️ GAZEBO'} INQUIRY DETAILS
                  </span>
                  {selectedInquiry.inquiryNumber && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFF5DC] text-[#8C6019] border border-[#EAD9B8]">
                      {selectedInquiry.inquiryNumber}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F0E]">
                  {selectedInquiry.brandName || selectedInquiry.companyName || selectedInquiry.fullName}
                </h2>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getInquiryStatusBadge(selectedInquiry.status)}`}>
                    Current: {selectedInquiry.status}
                  </span>
                  <span className="text-xs font-mono text-[#6E5336]">
                    {new Date(selectedInquiry.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-[#6E5336] uppercase tracking-wider flex items-center space-x-1">
                      <span>Contact Person</span>
                    </div>
                    <div className="text-sm font-bold text-[#2D1F0E] mt-0.5">
                      {selectedInquiry.contactName || selectedInquiry.fullName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#6E5336] uppercase tracking-wider">WhatsApp Phone</div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-sm font-bold text-[#2D1F0E] font-mono">
                        +91 {selectedInquiry.phone}
                      </span>
                      <a
                        href={`https://wa.me/91${selectedInquiry.phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition shadow-sm"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Gazebo Level */}
                  {inquiryType === 'gazebo' && selectedInquiry.level && (
                    <div>
                      <div className="text-[10px] font-bold text-[#6E5336] uppercase tracking-wider flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>Gazebo Level</span>
                      </div>
                      <div className="mt-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF5DC] text-[#8C6019] border border-[#EAD9B8]">
                          Level {selectedInquiry.level} —
                          {selectedInquiry.level === 1 ? ' Elevated Amphitheater' :
                           selectedInquiry.level === 2 ? ' Royal Pavilion' :
                           ' Imperial Sky Lounge'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Assigned Gazebo */}
                  {inquiryType === 'gazebo' && selectedInquiry.gazebo && (
                    <div>
                      <div className="text-[10px] font-bold text-[#6E5336] uppercase tracking-wider">Assigned Unit</div>
                      <div className="text-sm font-bold text-[#2D1F0E] mt-0.5 font-mono">{selectedInquiry.gazebo.gazeboNumber}</div>
                    </div>
                  )}


                  {/* Sponsor Tier */}
                  {selectedInquiry.sponsorshipType && (
                    <div className="col-span-2">
                      <div className="text-[10px] font-bold text-[#6E5336] uppercase tracking-wider">Sponsorship Tier</div>
                      <div className="text-sm font-bold text-[#D99427] mt-0.5">{selectedInquiry.sponsorshipType}</div>
                    </div>
                  )}

                  {/* Email */}
                  {selectedInquiry.email && (
                    <div className="col-span-2">
                      <div className="text-[10px] font-bold text-[#6E5336] uppercase tracking-wider">Email Address</div>
                      <div className="text-sm font-bold text-[#2D1F0E] mt-0.5">{selectedInquiry.email}</div>
                    </div>
                  )}
                </div>
                
                {/* Notes & Requirements */}
                <div className="pt-4 border-t border-[#EAD9B8]">
                  <div className="text-[10px] font-bold text-[#6E5336] uppercase tracking-wider mb-2">
                    {inquiryType === 'gazebo' ? '🏛️ VIP Concierge Requests' :
                     inquiryType === 'sponsor' ? '📋 Brand Objectives & Activation Notes' :
                     '📝 Special Requirements & Notes'}
                  </div>
                  <div className="text-sm text-[#2D1F0E] bg-white p-3.5 rounded-xl border border-[#EAD9B8] italic whitespace-pre-wrap leading-relaxed">
                    {selectedInquiry.notes || 'No special requirements or notes provided.'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary Actions: Reject / Contact / Approve */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, inquiryType, 'REJECTED')}
                    disabled={actionLoading || selectedInquiry.status === 'REJECTED'}
                    className="flex-1 px-4 py-2.5 rounded-full bg-rose-50 text-rose-700 font-bold text-xs uppercase hover:bg-rose-100 border border-rose-200 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, inquiryType, 'CONTACTED')}
                    disabled={actionLoading || selectedInquiry.status === 'CONTACTED'}
                    className="flex-1 px-4 py-2.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs uppercase hover:bg-indigo-100 border border-indigo-200 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Mark Contacted</span>
                  </button>
                  <button
                    onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, inquiryType, 'APPROVED')}
                    disabled={actionLoading || selectedInquiry.status === 'APPROVED'}
                    className="flex-1 px-4 py-2.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs uppercase hover:bg-emerald-100 border border-emerald-200 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>

                {/* Gazebo-only: HOLD / DISCUSSION / CONFIRMED */}
                {inquiryType === 'gazebo' && (
                  <div className="flex gap-3 flex-wrap pt-2 border-t border-[#EAD9B8]">
                    <div className="w-full text-[10px] font-bold text-[#8C6019] uppercase tracking-wider flex items-center space-x-1">
                      <Crown className="w-3 h-3" />
                      <span>Gazebo-Specific Actions</span>
                    </div>
                    <button
                      onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'gazebo', 'HOLD')}
                      disabled={actionLoading || selectedInquiry.status === 'HOLD'}
                      className="flex-1 px-4 py-2.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs uppercase hover:bg-amber-100 border border-amber-300 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Place on Hold</span>
                    </button>
                    <button
                      onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'gazebo', 'DISCUSSION')}
                      disabled={actionLoading || selectedInquiry.status === 'DISCUSSION'}
                      className="flex-1 px-4 py-2.5 rounded-full bg-purple-50 text-purple-800 font-bold text-xs uppercase hover:bg-purple-100 border border-purple-200 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>In Discussion</span>
                    </button>
                    <button
                      onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'gazebo', 'CONFIRMED')}
                      disabled={actionLoading || selectedInquiry.status === 'CONFIRMED'}
                      className="flex-1 px-4 py-2.5 rounded-full bg-teal-50 text-teal-800 font-bold text-xs uppercase hover:bg-teal-100 border border-teal-300 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Confirm Booking</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
