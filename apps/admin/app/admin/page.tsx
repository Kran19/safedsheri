'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, getStoredUser, clearAuthToken } from '../../lib/api';
import { 
  Users, CreditCard, Ticket, Activity, Shield, FileText, AlertCircle, 
  RefreshCw, CheckCircle2, Crown, Eye, ThumbsUp, ThumbsDown, 
  Store, Building2, CheckSquare, Sparkles, DollarSign, Timer, Flame,
  EyeOff, Clock, Sliders, ArrowRight, MessageCircle, Phone, ExternalLink,
  Tag, MapPin, Settings, Trash2, Lock, Flag, X
} from 'lucide-react';
import LogoSlot from '../components/LogoSlot';
import { AdvancedTabulatorTable, TabulatorColumn } from '../components/AdvancedTabulatorTable';
import { AadhaarDocumentPreview } from '../components/AadhaarDocumentPreview';
import { getMaintenanceMode, toggleMaintenanceMode } from '../actions/maintenance';
import BookingDesk from '../components/BookingDesk';
import GazeboManageGuestsModal from '../components/GazeboManageGuestsModal';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'attendees' | 'payments' | 'gazebos' | 'sponsors' | 'scans' | 'audit' | 'pricing' | 'settings' | 'trash' | 'book_pass'>('applications');
  const [trashApplications, setTrashApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userForm, setUserForm] = useState({ username: '', password: '', fullName: '', role: 'TICKETING_FINANCE' });
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [hardDeleteModalOpen, setHardDeleteModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [appToEdit, setAppToEdit] = useState<any | null>(null);
  const [editFormAttendees, setEditFormAttendees] = useState<any[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Edit Staff User Modal States
  const [editStaffModalOpen, setEditStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<any | null>(null);
  const [editStaffForm, setEditStaffForm] = useState({ username: '', password: '', fullName: '', role: 'TICKETING_FINANCE' });
  const [editStaffError, setEditStaffError] = useState<string | null>(null);
  const [editStaffSuccess, setEditStaffSuccess] = useState<string | null>(null);
  const [editStaffLoading, setEditStaffLoading] = useState(false);
  
  const [paymentAction, setPaymentAction] = useState<{ row: any, method: string } | null>(null);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  
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
    const [credentialsForm, setCredentialsForm] = useState({ newUsername: '', newPassword: '', currentPassword: '' });
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [credentialsSuccess, setCredentialsSuccess] = useState('');

  async function handleUpdateCredentials(e: React.FormEvent) {
    e.preventDefault();
    setCredentialsError('');
    setCredentialsSuccess('');
    
    if (!credentialsForm.currentPassword) {
      setCredentialsError('Current password is required to save changes.');
      return;
    }

    if (!credentialsForm.newUsername?.trim() && !credentialsForm.newPassword?.trim()) {
      setCredentialsError('Please enter a new email/username or a new password.');
      return;
    }

    setCredentialsLoading(true);
    const payload: any = {
      currentPassword: credentialsForm.currentPassword,
    };
    if (credentialsForm.newUsername?.trim()) {
      payload.newUsername = credentialsForm.newUsername.trim();
    }
    if (credentialsForm.newPassword?.trim()) {
      payload.newPassword = credentialsForm.newPassword.trim();
    }

    const res = await apiRequest('/auth/update-credentials', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    setCredentialsLoading(false);
    if (res.success) {
      setCredentialsSuccess('Credentials updated successfully! Redirecting to login in 2 seconds...');
      setTimeout(() => {
        clearAuthToken();
        window.location.href = '/login';
      }, 2000);
    } else {
      setCredentialsError(res.error?.message || 'Failed to update credentials.');
    }
  }

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

  // Gazebo Direct Booking Modal State
  const [selectedGazeboForBooking, setSelectedGazeboForBooking] = useState<any | null>(null);
  const [manageGuestsGazebo, setManageGuestsGazebo] = useState<any | null>(null);
  const [bookingForm, setBookingForm] = useState<{
    fullName: string;
    phone: string;
    email: string;
    amount: number | string;
    notes: string;
    status: 'CONFIRMED' | 'HOLD';
  }>({
    fullName: '',
    phone: '',
    email: '',
    amount: '',
    notes: '',
    status: 'CONFIRMED',
  });
  const [bookingLoading, setBookingLoading] = useState(false);

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
    setCurrentUser(user);
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
    } else if (tab === 'trash') {
      const res = await apiRequest('/registrations/trash');
      if (res.success) setTrashApplications(res.data || []);
    } else if (tab === 'users') {
      const res = await apiRequest('/users');
      if (res.success) setUsers(res.data || []);
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
      loadOverviewData(true);
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
      loadOverviewData(true);
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
      loadOverviewData(true);
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

  async function handleApproveCashierRequest(appId: string) {
    if (!confirm('Approve this cashier booking and issue pass?')) return;
    setActionLoading(true);
    setError('');
    const res = await apiRequest(`/registrations/${appId}/approve-cashier-request`, { method: 'POST' });
    if (res.success) {
      setMessage('Cashier booking approved successfully! Pass issued.');
      loadOverviewData(true);
      loadTabContent('applications', true);
    } else {
      setError(res.error?.message || 'Failed to approve cashier request');
    }
    setActionLoading(false);
  }

  async function handleRejectCashierRequest(appId: string) {
    const reason = prompt('Reason for rejection? (Optional)');
    if (reason === null) return;
    setActionLoading(true);
    setError('');
    const res = await apiRequest(`/registrations/${appId}/reject-cashier-request`, {
      method: 'POST',
      body: JSON.stringify({ notes: reason }),
    });
    if (res.success) {
      setMessage('Cashier booking rejected.');
      loadOverviewData(true);
      loadTabContent('applications', true);
    } else {
      setError(res.error?.message || 'Failed to reject cashier request');
    }
    setActionLoading(false);
  }

  function isPaidApp(app: any): boolean {
    if (!app) return false;
    if (currentUser?.username === 'masteradmin@safedsheri.com') return false;
    if (app.status === 'PAYMENT_CONFIRMED' || app.status === 'PASS_ISSUED') return true;
    if (app.payments && Array.isArray(app.payments)) {
      if (app.payments.some((p: any) => p.status === 'CONFIRMED')) return true;
    }
    if (app.credentials && Array.isArray(app.credentials) && app.credentials.length > 0) return true;
    return false;
  }

  async function handleSoftDelete() {
    if (!appToDelete) return;
    if (isPaidApp(appToDelete)) {
      setError('Cannot move to trash: Payment has already been completed for this application.');
      setDeleteModalOpen(false);
      setAppToDelete(null);
      return;
    }
    setActionLoading(true);
    const res = await apiRequest(`/registrations/${appToDelete.id}/trash`, { method: 'POST' });
    if (res.success) {
      setMessage('Application moved to trash.');
      setDeleteModalOpen(false);
      setAppToDelete(null);
      loadOverviewData(true);
      loadTabContent('applications');
    } else {
      setError(res.error?.message || 'Failed to move to trash');
    }
    setActionLoading(false);
  }

  async function handleRestore() {
    if (!appToDelete) return;
    setActionLoading(true);
    const res = await apiRequest(`/registrations/${appToDelete.id}/restore`, { method: 'POST' });
    if (res.success) {
      setMessage('Application restored successfully.');
      setRestoreModalOpen(false);
      setAppToDelete(null);
      loadTabContent('trash');
      loadOverviewData(true);
    } else {
      setError(res.error?.message || 'Failed to restore application');
    }
    setActionLoading(false);
  }

  async function handleHardDelete() {
    if (!appToDelete) return;
    if (isPaidApp(appToDelete)) {
      setError('Cannot permanently delete: Payment has already been completed for this application.');
      setHardDeleteModalOpen(false);
      setAppToDelete(null);
      return;
    }
    setActionLoading(true);
    const res = await apiRequest(`/registrations/${appToDelete.id}/permanent-delete`, { method: 'POST' });
    if (res.success) {
      setMessage('Application permanently deleted.');
      setHardDeleteModalOpen(false);
      setAppToDelete(null);
      loadOverviewData(true);
      loadTabContent('trash');
    } else {
      setError(res.error?.message || 'Failed to permanently delete');
    }
    setActionLoading(false);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(null);
    setUserLoading(true);
    const res = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userForm),
    });
    if (res.success) {
      setUserSuccess('User created successfully.');
      setUserForm({ username: '', password: '', fullName: '', role: 'TICKETING_FINANCE' });
      const listRes = await apiRequest('/users');
      if (listRes.success) setUsers(listRes.data || []);
    } else {
      setUserError(res.error?.message || 'Failed to create user.');
    }
    setUserLoading(false);
  }

  async function handleToggleUserActive(userId: string, currentActive: boolean) {
    setMessage('');
    setError('');
    const res = await apiRequest(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !currentActive }),
    });
    if (res.success) {
      setMessage(res.message || 'User status updated.');
      const listRes = await apiRequest('/users');
      if (listRes.success) setUsers(listRes.data || []);
    } else {
      setError(res.error?.message || 'Failed to update user status.');
    }
  }

  function openEditModal(app: any) {
    setAppToEdit(app);
    setEditError(null);
    setEditSuccess(null);
    const attList = app.attendees?.map((ra: any) => ({
      id: ra.attendee.id,
      fullName: ra.attendee.fullName || '',
      phone: ra.attendee.phone || '',
      email: ra.attendee.email || '',
      gender: ra.attendee.gender || 'FEMALE',
      aadhaarNumber: '', // Keep blank unless updating
      isPrimary: ra.isPrimary,
    })) || [];
    setEditFormAttendees(attList);
    setEditModalOpen(true);
  }

  async function handleSaveAttendeeEdits(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      for (const att of editFormAttendees) {
        const payload: any = {
          fullName: att.fullName,
          phone: att.phone,
          email: att.email,
          gender: att.gender,
        };
        if (att.aadhaarNumber && att.aadhaarNumber.trim().length > 0) {
          payload.aadhaarNumber = att.aadhaarNumber;
        }

        const res = await apiRequest(`/attendees/${att.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.success) {
          throw new Error(res.error?.message || `Failed to update attendee ${att.fullName}`);
        }
      }

      setEditSuccess('Attendee details updated successfully!');
      setTimeout(() => {
        setEditModalOpen(false);
        setAppToEdit(null);
      }, 1500);
      loadTabContent('applications', true);
    } catch (err: any) {
      setEditError(err.message || 'An error occurred while saving.');
    } finally {
      setEditLoading(false);
    }
  }

  function openEditStaffModal(userItem: any) {
    setStaffToEdit(userItem);
    setEditStaffError(null);
    setEditStaffSuccess(null);
    setEditStaffForm({
      username: userItem.username || '',
      password: '', // Keep empty unless updating
      fullName: userItem.fullName || '',
      role: userItem.role || 'TICKETING_FINANCE',
    });
    setEditStaffModalOpen(true);
  }

  async function handleSaveStaffEdits(e: React.FormEvent) {
    e.preventDefault();
    setEditStaffLoading(true);
    setEditStaffError(null);
    setEditStaffSuccess(null);

    const payload: any = {
      username: editStaffForm.username,
      fullName: editStaffForm.fullName,
      role: editStaffForm.role,
    };
    if (editStaffForm.password && editStaffForm.password.trim().length > 0) {
      payload.password = editStaffForm.password;
    }

    const res = await apiRequest(`/users/${staffToEdit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setEditStaffSuccess('Staff user updated successfully!');
      setTimeout(() => {
        setEditStaffModalOpen(false);
        setStaffToEdit(null);
      }, 1500);
      const listRes = await apiRequest('/users');
      if (listRes.success) setUsers(listRes.data || []);
    } else {
      setEditStaffError(res.error?.message || 'Failed to update staff user.');
    }
    setEditStaffLoading(false);
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

  async function handleDirectBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGazeboForBooking) return;
    setBookingLoading(true);
    setMessage('');
    setError('');

    const res = await apiRequest(`/gazebos/${selectedGazeboForBooking.id}/book`, {
      method: 'POST',
      body: JSON.stringify({
        ...bookingForm,
        amount: bookingForm.amount ? Number(bookingForm.amount) : undefined,
      }),
    });

    setBookingLoading(false);
    if (res.success) {
      setMessage(`✅ Gazebo ${selectedGazeboForBooking.gazeboNumber} (${bookingForm.status === 'CONFIRMED' ? 'Booked' : 'Placed on Hold'}) successfully!`);
      setSelectedGazeboForBooking(null);
      loadTabContent('gazebos');
    } else {
      setError(res.error?.message || 'Failed to book gazebo');
    }
  }

  async function handleReleaseGazebo(gazeboId: string, gazeboNumber: string, num: number) {
    if (!confirm(`Are you sure you want to release Gazebo #${num} (${gazeboNumber}) back to AVAILABLE inventory?`)) {
      return;
    }
    setMessage('');
    setError('');
    const res = await apiRequest(`/gazebos/${gazeboId}/release`, { method: 'POST' });
    if (res.success) {
      setMessage(`✅ Gazebo #${num} (${gazeboNumber}) is now AVAILABLE for new allocations.`);
      loadTabContent('gazebos');
    } else {
      setError(res.error?.message || 'Failed to release gazebo');
    }
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
        const hasOcrMismatch = row.attendees?.some((ra: any) => ra.attendee?.document?.ocrMismatch);
        return (
          <div>
            <div className="font-semibold text-[#2D1F0E]">{primary?.fullName || '—'}</div>
            <div className="text-[10px] text-[#6E5336] flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>{row.passType === 'SINGLE' && primary?.gender === 'FEMALE' ? 'SINGLE FEMALE' : primary?.gender}</span>
              {hasOcrMismatch && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[9px] flex items-center space-x-1 animate-pulse">
                  <Flag className="w-2.5 h-2.5 text-rose-600 fill-rose-600" />
                  <span>OCR MISMATCH</span>
                </span>
              )}
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
      key: 'paymentMethod',
      title: 'Payment Method',
      sortable: true,
      getValue: (row) => {
        const confirmed = row.payments?.find((p: any) => p.status === 'CONFIRMED');
        if (confirmed) return confirmed.method;
        const pending = row.payments?.find((p: any) => p.status === 'PENDING');
        return pending ? pending.method : 'UNPAID';
      },
      render: (row) => {
        const confirmed = row.payments?.find((p: any) => p.status === 'CONFIRMED');
        const pending = row.payments?.find((p: any) => p.status === 'PENDING');
        const currentMethod = confirmed ? confirmed.method : (pending ? pending.method : 'UNPAID');

        return (
          <select
            value={currentMethod}
            onClick={(e) => e.stopPropagation()} // Prevent row click details modal
            onChange={async (e) => {
              const method = e.target.value;
              if (method === 'UNPAID') return;
              
              if (confirmed) {
                setMessage('');
                setError('');
                const res = await apiRequest(`/registrations/${row.id}/payment-method`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ method }),
                });
                
                if (res.success) {
                  setMessage(res.message || 'Payment method updated successfully.');
                  loadOverviewData(true);
                  loadTabContent('applications', true);
                } else {
                  setError(res.error?.message || 'Failed to update payment method.');
                }
              } else {
                setPaymentAction({ row, method });
              }
            }}
            className="px-2.5 py-1.5 bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl text-[11px] text-[#2D1F0E] focus:border-[#D99427] focus:ring-1 focus:ring-[#D99427] outline-none transition font-medium shadow-sm cursor-pointer"
          >
            <option value="UNPAID" disabled={currentMethod !== 'UNPAID'}>Unpaid</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="UPI_QR">UPI QR</option>
            <option value="ONLINE_GATEWAY">Online (Razorpay)</option>
            <option value="CUSTOM_DIRECT">Custom Direct</option>
          </select>
        );
      }
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          row.status === 'PASS_ISSUED' || row.status === 'PAYMENT_CONFIRMED'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : row.status === 'PAYMENT_PENDING' || row.status === 'APPROVED' || row.status === 'CASHIER_PENDING'
            ? 'bg-amber-100 text-amber-800 border border-amber-300'
            : row.status === 'UNDER_REVIEW' || row.status === 'SUBMITTED'
            ? 'bg-blue-100 text-blue-800 border border-blue-300'
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {row.status === 'CASHIER_PENDING' ? 'CASHIER PENDING' : row.status}
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
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openReviewModal(row);
            }}
            title="Review Application"
            className="p-1.5 rounded-xl bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] transition shadow-sm"
          >
            <Eye className="w-4 h-4 text-[#D99427]" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            title="Edit Application"
            className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition shadow-sm"
          >
            <Sliders className="w-4 h-4 text-blue-600" />
          </button>
          
          {row.status === 'CASHIER_PENDING' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApproveCashierRequest(row.id);
                }}
                disabled={actionLoading}
                title="Approve Booking"
                className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectCashierRequest(row.id);
                }}
                disabled={actionLoading}
                title="Reject Booking"
                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition shadow-sm"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {row.paymentLinkId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const payUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://safedsheri.com'}/order/${row.paymentLinkId}`;
                navigator.clipboard.writeText(payUrl);
                setMessage('Payment link copied to clipboard!');
                setTimeout(() => setMessage(''), 3000);
              }}
              title="Copy Payment Link"
              className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          {isPaidApp(row) && currentUser?.username !== 'masteradmin@safedsheri.com' ? (
            <span
              title="Paid applications cannot be deleted"
              className="p-1.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed select-none"
            >
              <Lock className="w-4 h-4 text-gray-400" />
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAppToDelete(row);
                setDeleteModalOpen(true);
              }}
              title="Move to Trash"
              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const trashColumns: TabulatorColumn<any>[] = [
    {
      key: 'registrationNumber',
      title: 'Application #',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-[#2D1F0E]">{row.registrationNumber}</span>,
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
      key: 'deletedAt',
      title: 'Deleted Date',
      sortable: true,
      getValue: (row) => new Date(row.deletedAt).toISOString(),
      render: (row) => (
        <span className="text-[#6E5336] font-mono text-[11px]">
          {new Date(row.deletedAt).toLocaleDateString()} {new Date(row.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Action',
      sortable: false,
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAppToDelete(row);
              setRestoreModalOpen(true);
            }}
            disabled={actionLoading}
            className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold text-[11px] inline-flex items-center space-x-1 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restore</span>
          </button>
          {!isPaidApp(row) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAppToDelete(row);
                setHardDeleteModalOpen(true);
              }}
              disabled={actionLoading}
              className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 border border-red-700 text-white font-semibold text-[11px] inline-flex items-center space-x-1 transition shadow-sm disabled:opacity-50"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Permanently Delete</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  // 2. Verified Attendees Columns
  const attendeeColumns: TabulatorColumn<any>[] = [
    { 
      key: 'fullName', 
      title: 'Attendee Name', 
      sortable: true, 
      render: (r) => (
        <div className="flex items-center space-x-2">
          <strong className="text-[#2D1F0E]">{r.fullName}</strong>
          {r.document?.ocrMismatch && (
            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[9px] flex items-center space-x-1">
              <Flag className="w-2.5 h-2.5 text-rose-600 fill-rose-600" />
              <span>DATA MODIFIED</span>
            </span>
          )}
        </div>
      ) 
    },
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
      key: 'mobileNumber',
      title: 'Mobile Number',
      sortable: true,
      getValue: (r) => r.registration?.attendees?.[0]?.attendee?.phone || '',
      render: (r) => <span className="font-mono">{r.registration?.attendees?.[0]?.attendee?.phone || '—'}</span>,
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
    {
      key: 'handledBy',
      title: 'Handled By',
      sortable: true,
      render: (r) => r.collectedBy ? (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-[#F5EDDF] text-[#6E5336] border border-[#D99427]/30">
          {r.collectedBy.fullName}
        </span>
      ) : <span className="text-gray-400 text-[10px] italic">System</span>,
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
    {
      key: 'actions',
      title: 'Action',
      sortable: false,
      align: 'right',
      render: (row) => (
        currentUser?.username === 'masteradmin@safedsheri.com' ? (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to permanently delete receipt ${row.receiptNumber}? This will revert the application status if no other payments exist.`)) {
                setError('');
                setMessage('');
                const res = await apiRequest(`/payments/${row.id}`, { method: 'DELETE' });
                if (res.success) {
                  setMessage(`Payment ${row.receiptNumber} deleted successfully.`);
                  const refreshRes = await apiRequest('/payments');
                  if (refreshRes.success) setPayments(refreshRes.data || []);
                } else {
                  setError(res.error?.message || 'Failed to delete payment');
                }
              }
            }}
            title="Delete Payment Record"
            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : null
      )
    }
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
          { id: 'settings', label: 'Account Settings', icon: Settings },
          { id: 'trash', label: 'Trash', icon: Trash2 },
          { id: 'book_pass', label: 'Book Pass', icon: Ticket },
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
                  {['ALL', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'CASHIER_PENDING', 'PASS_ISSUED', 'REJECTED'].map((st) => (
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
                  <option value="KIDS">Kids Pass</option>
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
        <div className="space-y-6 animate-fade-in">
          {/* Header Summary Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FFFDF9] via-[#FAF6EE] to-[#FFF9EE] border-2 border-[#D99427]/40 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-[10px] font-mono tracking-widest font-bold text-[#8C6019] uppercase mb-1">
                <Crown className="w-3.5 h-3.5 text-[#D99427]" />
                <span>12 SPATIAL VIP GAZEBO CABANAS</span>
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#2D1F0E]">
                VIP Gazebo Inventory & Direct Allocation
              </h2>
              <p className="text-xs text-[#6E5336] mt-1 max-w-xl">
                Manage all 12 physical luxury gazebos across 3 spatial levels. Directly allocate, hold, or assign guests with optional host contact details.
              </p>
            </div>

            {/* Quick Stat Counter Badges */}
            <div className="flex flex-wrap gap-2.5">
              <div className="px-4 py-2 rounded-2xl bg-white border border-[#EAD9B8] shadow-sm text-center min-w-[75px]">
                <div className="text-[9px] font-mono font-bold text-[#8C6019] uppercase">TOTAL</div>
                <div className="text-lg font-serif font-bold text-[#2D1F0E]">12</div>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm text-center min-w-[75px]">
                <div className="text-[9px] font-mono font-bold text-emerald-800 uppercase">AVAILABLE</div>
                <div className="text-lg font-serif font-bold text-emerald-800">
                  {gazebos.filter((g) => g.status === 'AVAILABLE').length}
                </div>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-red-50 border border-red-300 shadow-sm text-center min-w-[75px]">
                <div className="text-[9px] font-mono font-bold text-red-800 uppercase">BOOKED</div>
                <div className="text-lg font-serif font-bold text-red-800">
                  {gazebos.filter((g) => g.status === 'CONFIRMED').length}
                </div>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm text-center min-w-[75px]">
                <div className="text-[9px] font-mono font-bold text-amber-900 uppercase">ON HOLD</div>
                <div className="text-lg font-serif font-bold text-amber-900">
                  {gazebos.filter((g) => g.status === 'HELD').length}
                </div>
              </div>
            </div>
          </div>

          {/* 12 Visual Gazebo Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {gazebos.map((gz, index) => {
              const gazeboIndex = index + 1; // 1 to 12
              const levelName = gz.level === 1 ? 'Sheri Chowk' : gz.level === 2 ? 'The Royal Sheri Pavillion' : 'Sheri Rass';
              const tierBadgeColor = gz.level === 2 ? 'bg-[#2D1F0E] text-[#F6C85F]' : 'bg-[#FAF6EE] text-[#8C6019] border border-[#EAD9B8]';
              const isBooked = gz.status === 'CONFIRMED';
              const isHeld = gz.status === 'HELD';
              const activeInquiry = gz.inquiries?.[0];

              return (
                <div
                  key={gz.id}
                  className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                    gz.level === 2
                      ? 'border-[#D99427] bg-gradient-to-b from-[#FFFDF9] via-white to-[#FAF6EE]'
                      : 'border-[#EAD9B8] bg-white'
                  }`}
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold shadow-sm ${tierBadgeColor}`}>
                          GAZEBO #{gazeboIndex}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#8C6019]">
                          {gz.gazeboNumber}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${
                          isBooked
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : isHeld
                            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isBooked ? 'CONFIRMED' : isHeld ? 'ON HOLD' : 'AVAILABLE'}
                      </span>
                    </div>

                    <h4 className="text-base font-serif font-bold text-[#2D1F0E] truncate">
                      {levelName}
                    </h4>
                    <div className="text-[11px] text-[#6E5336] flex items-center justify-between mt-0.5 font-medium">
                      <span>Level {gz.level} Spatial Cabana</span>
                      <span className="font-mono font-bold text-[#8C6019]">
                        ₹{Number(gz.price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Body: Guest Information or Available Status */}
                  {(isBooked || isHeld) && activeInquiry ? (
                    <div className="p-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs space-y-1">
                      <div className="text-[9px] font-mono text-[#8C6019] uppercase tracking-wider font-bold">
                        {isBooked ? 'BOOKED FOR GUEST' : 'RESERVED ON HOLD FOR'}
                      </div>
                      <div className="font-serif font-bold text-sm text-[#2D1F0E] truncate">
                        {activeInquiry.fullName}
                      </div>
                      <div className="text-[11px] text-[#6E5336] font-mono flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-[#D99427]" />
                        <span>{activeInquiry.phone}</span>
                      </div>
                      {activeInquiry.notes && (
                        <div className="text-[10px] text-[#6E5336] italic truncate border-t border-[#EAD9B8]/60 pt-1">
                          {activeInquiry.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                      <div className="font-bold flex items-center space-x-1 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Available for Booking</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 leading-tight">
                        14 VIP Guests Capacity • Private Butler
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#EAD9B8]/70">
                    {gz.status === 'AVAILABLE' ? (
                      <button
                        onClick={() => {
                          setSelectedGazeboForBooking(gz);
                          setBookingForm({
                            fullName: '',
                            phone: '',
                            email: '',
                            amount: Number(gz.price),
                            notes: '',
                            status: 'CONFIRMED',
                          });
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#2D1F0E] hover:bg-[#4A351B] text-[#F6C85F] text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-1.5"
                      >
                        <Crown className="w-3.5 h-3.5 text-[#F6C85F]" />
                        <span>Book Gazebo #{gazeboIndex}</span>
                      </button>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setSelectedGazeboForBooking(gz);
                              setBookingForm({
                                fullName: activeInquiry?.fullName || '',
                                phone: activeInquiry?.phone || '',
                                email: activeInquiry?.notes?.match(/Email:\s*([^|]+)/)?.[1]?.trim() || '',
                                amount: Number(gz.price),
                                notes: activeInquiry?.notes || '',
                                status: gz.status === 'HELD' ? 'HOLD' : 'CONFIRMED',
                              });
                            }}
                            className="py-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] text-[11px] font-bold transition flex items-center justify-center space-x-1"
                          >
                            <span>✏️ Edit Host</span>
                          </button>
                          <button
                            onClick={() => handleReleaseGazebo(gz.id, gz.gazeboNumber, gazeboIndex)}
                            className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold transition flex items-center justify-center space-x-1"
                          >
                            <span>Release</span>
                          </button>
                        </div>
                        <div className="mt-2">
                          <button
                            onClick={() => setManageGuestsGazebo(gz)}
                            className="w-full py-2.5 rounded-xl bg-[#2D1F0E] hover:bg-[#4A351B] text-[#F6C85F] text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-1.5"
                          >
                            <Users className="w-3.5 h-3.5 text-[#F6C85F]" />
                            <span>👥 Manage Guests</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incoming VIP Inquiries Table */}
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
            title="VIP Gazebo Inquiries & Requests"
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

      {/* ========================================================================= */}
      {/* TAB: BOOK PASS */}
      {/* ========================================================================= */}
      {activeTab === 'book_pass' && (
        <BookingDesk hideHeader={true} />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in">
          {/* ACCOUNT SETTINGS - CREDENTIALS */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#EAD9B8]">
            <h2 className="text-2xl font-serif text-[#2D1F0E] mb-2 flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#8C6019]" />
              Admin Credentials
            </h2>
            <p className="text-sm text-[#6E5336] mb-6">
              Change your login email ID (username) or password. You will be asked to re-login if changes are successful.
            </p>

            <form onSubmit={handleUpdateCredentials} className="space-y-6 max-w-lg">
              {credentialsSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  {credentialsSuccess}
                </div>
              )}
              {credentialsError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {credentialsError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#6E5336] mb-1.5 uppercase tracking-wider">New Email / Username</label>
                <input
                  type="text"
                  value={credentialsForm.newUsername}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, newUsername: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="w-full bg-[#F8F5EE] border-2 border-[#EAD9B8] rounded-xl px-4 py-3 text-[#2D1F0E] focus:outline-none focus:border-[#8C6019] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E5336] mb-1.5 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={credentialsForm.newPassword}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, newPassword: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="w-full bg-[#F8F5EE] border-2 border-[#EAD9B8] rounded-xl px-4 py-3 text-[#2D1F0E] focus:outline-none focus:border-[#8C6019] transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-[#EAD9B8]">
                <label className="block text-xs font-bold text-[#D99427] mb-1.5 uppercase tracking-wider">Current Password (Required)</label>
                <input
                  type="password"
                  required
                  value={credentialsForm.currentPassword}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, currentPassword: e.target.value })}
                  placeholder="Enter current password to verify"
                  className="w-full bg-[#F8F5EE] border-2 border-[#EAD9B8] rounded-xl px-4 py-3 text-[#2D1F0E] focus:outline-none focus:border-[#D99427] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={credentialsLoading}
                className="w-full py-4 rounded-xl bg-[#2D1F0E] text-white font-bold tracking-widest uppercase hover:bg-[#1A1208] transition-colors shadow-lg disabled:opacity-50"
              >
                {credentialsLoading ? 'Saving...' : 'Update Credentials'}
              </button>
            </form>
          </div>

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

                    {/* CRITICAL OCR MISMATCH AUDIT ALERT */}
                    {(() => {
                      const doc = att.document;
                      if (!doc) return null;
                      let ocrInfo: any = null;
                      try {
                        if (doc.ocrExtractedData) ocrInfo = JSON.parse(doc.ocrExtractedData);
                      } catch (e) {}

                      if (!doc.ocrMismatch && (!ocrInfo || !ocrInfo.discrepancies || ocrInfo.discrepancies.length === 0)) {
                        return null;
                      }

                      return (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-500 text-rose-950 space-y-3 shadow-md animate-pulse">
                          <div className="flex items-start space-x-3">
                            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow">
                              🚩
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-sm text-rose-900 tracking-wide">
                                  CRITICAL AUDIT ALERT: USER CHANGED DATA AFTER AADHAAR UPLOAD
                                </span>
                                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
                                  CHECK CAREFULLY
                                </span>
                              </div>
                              <p className="text-xs text-rose-800 mt-0.5 font-medium">
                                The applicant uploaded an Aadhaar card and then manually modified one or more extracted fields. Compare the uploaded ID document with the form submission below before making an approval decision.
                              </p>
                            </div>
                          </div>

                          {/* Discrepancies Details */}
                          {ocrInfo?.discrepancies && ocrInfo.discrepancies.length > 0 && (
                            <div className="bg-white/90 p-3 rounded-xl border border-rose-300 text-xs space-y-1.5 shadow-inner">
                              <div className="font-bold text-rose-950 flex items-center space-x-1.5">
                                <span>⚠️</span>
                                <span>Specific Modified Fields Detected:</span>
                              </div>
                              <ul className="list-disc pl-5 space-y-1 text-rose-900 font-medium">
                                {ocrInfo.discrepancies.map((d: string, dIdx: number) => (
                                  <li key={dIdx} className="font-mono text-[11px]">{d}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Side-by-Side Comparison Box */}
                          {ocrInfo?.extracted && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 shadow-sm">
                                <div className="font-bold text-amber-900 uppercase text-[10px] tracking-wider mb-2 flex items-center space-x-1">
                                  <span>📄</span>
                                  <span>Data Read from Aadhaar Image (OCR)</span>
                                </div>
                                <div className="space-y-1 text-[11px]">
                                  <div><span className="text-[#6E5336]">Name:</span> <strong className="font-mono text-amber-950 ml-1">{ocrInfo.extracted.name || '—'}</strong></div>
                                  <div><span className="text-[#6E5336]">Aadhaar:</span> <strong className="font-mono text-amber-950 ml-1">{ocrInfo.extracted.aadhaarNumber || '—'}</strong></div>
                                  <div><span className="text-[#6E5336]">Gender:</span> <strong className="font-mono text-amber-950 ml-1">{ocrInfo.extracted.gender || '—'}</strong></div>
                                  {ocrInfo.extracted.dob && <div><span className="text-[#6E5336]">DOB:</span> <strong className="font-mono text-amber-950 ml-1">{ocrInfo.extracted.dob}</strong></div>}
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-300 shadow-sm">
                                <div className="font-bold text-rose-900 uppercase text-[10px] tracking-wider mb-2 flex items-center space-x-1">
                                  <span>✍️</span>
                                  <span>Data Submitted by Applicant in Form</span>
                                </div>
                                <div className="space-y-1 text-[11px]">
                                  <div><span className="text-[#6E5336]">Name:</span> <strong className="font-mono text-rose-950 ml-1">{att.fullName}</strong></div>
                                  <div><span className="text-[#6E5336]">Aadhaar:</span> <strong className="font-mono text-rose-950 ml-1">{att.aadhaarMasked || att.aadhaarNumber}</strong></div>
                                  <div><span className="text-[#6E5336]">Gender:</span> <strong className="font-mono text-rose-950 ml-1">{att.gender}</strong></div>
                                  {att.dob && <div><span className="text-[#6E5336]">DOB:</span> <strong className="font-mono text-rose-950 ml-1">{new Date(att.dob).toLocaleDateString()}</strong></div>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

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
                          if (age > 10 && age <= 15) return sum + 1200;
                          return sum; // Free for <= 10
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
      {/* TAB: TRASH */}
      {/* ========================================================================= */}
      {activeTab === 'trash' && (
        <AdvancedTabulatorTable
          data={trashApplications}
          columns={trashColumns}
          keyField="id"
          title="Trash Bin"
          subtitle="Soft-deleted applications. Permanent deletion cannot be undone."
          defaultPageSize={10}
          onRefresh={() => loadTabContent('trash')}
          isLoading={loading}
        />
      )}




      {/* ========================================================================= */}
      {/* EDIT ATTENDEE DETAILS MODAL */}
      {/* ========================================================================= */}
      {editModalOpen && appToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#EAD9B8] my-8 flex flex-col">
            <div className="p-6 bg-[#FAF6EE] border-b border-[#EAD9B8] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#2D1F0E]">Edit Attendee Details</h3>
                <p className="text-xs text-[#6E5336] mt-0.5">Correct details submitted in application <strong className="font-mono">{appToEdit.registrationNumber}</strong>.</p>
              </div>
              <button
                onClick={() => { setEditModalOpen(false); setAppToEdit(null); }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <EyeOff className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendeeEdits} className="flex-1 overflow-y-auto p-6 space-y-6">
              {editError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold shadow-sm">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold shadow-sm">
                  {editSuccess}
                </div>
              )}

              <div className="space-y-6 divide-y divide-gray-100">
                {editFormAttendees.map((att, index) => (
                  <div key={att.id} className={`${index > 0 ? 'pt-6' : ''} space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#2D1F0E] flex items-center space-x-2">
                        <span className="w-6 h-6 bg-[#D99427] text-white rounded-full flex items-center justify-center text-xs font-mono font-bold">
                          {index + 1}
                        </span>
                        <span>{att.isPrimary ? 'Primary Applicant' : `Co-Applicant #${index}`}</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6E5336] mb-1.5 uppercase tracking-wider">Full Name</label>
                        <input
                          type="text"
                          required
                          value={att.fullName}
                          onChange={(e) => {
                            const copy = [...editFormAttendees];
                            copy[index].fullName = e.target.value;
                            setEditFormAttendees(copy);
                          }}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6E5336] mb-1.5 uppercase tracking-wider">WhatsApp Phone</label>
                        <input
                          type="text"
                          required
                          value={att.phone}
                          onChange={(e) => {
                            const copy = [...editFormAttendees];
                            copy[index].phone = e.target.value;
                            setEditFormAttendees(copy);
                          }}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6E5336] mb-1.5 uppercase tracking-wider">Email Address</label>
                        <input
                          type="email"
                          value={att.email}
                          onChange={(e) => {
                            const copy = [...editFormAttendees];
                            copy[index].email = e.target.value;
                            setEditFormAttendees(copy);
                          }}
                          placeholder="e.g. name@example.com"
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6E5336] mb-1.5 uppercase tracking-wider">Gender</label>
                        <select
                          value={att.gender}
                          onChange={(e) => {
                            const copy = [...editFormAttendees];
                            copy[index].gender = e.target.value;
                            setEditFormAttendees(copy);
                          }}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none transition cursor-pointer"
                        >
                          <option value="MALE">MALE</option>
                          <option value="FEMALE">FEMALE</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1.5 uppercase tracking-wider">
                        Update Aadhaar Number (Leave blank to keep current)
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="12-digit Aadhaar Number (e.g. 512345678901)"
                        value={att.aadhaarNumber}
                        onChange={(e) => {
                          const copy = [...editFormAttendees];
                          copy[index].aadhaarNumber = e.target.value.replace(/\D/g, '');
                          setEditFormAttendees(copy);
                        }}
                        className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none transition"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setAppToEdit(null); }}
                  className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2.5 rounded-full bg-[#2D1F0E] text-white hover:opacity-90 disabled:opacity-50 text-xs font-bold transition shadow-sm"
                >
                  {editLoading ? 'Saving Edits...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREMIUM SOFT DELETE MODAL */}
      {/* ========================================================================= */}
      {deleteModalOpen && appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-red-100 flex flex-col">
            <div className="p-6 bg-red-50 border-b border-red-100 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-red-900">Move to Trash?</h3>
            </div>
            <div className="p-6 text-center text-[#6E5336]">
              {isPaidApp(appToDelete) ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-semibold space-y-1 text-left">
                  <div className="flex items-center space-x-2 font-bold text-sm text-amber-950">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Payment Completed</span>
                  </div>
                  <p>Application <strong className="font-mono">{appToDelete.registrationNumber}</strong> has already completed payment or has active passes issued. It cannot be deleted or moved to trash.</p>
                </div>
              ) : (
                <>
                  <p>Are you sure you want to move application <strong className="text-red-700">{appToDelete.registrationNumber}</strong> to the trash?</p>
                  <p className="mt-2 text-sm">It will be hidden from the main view but can still be found in the Trash tab.</p>
                </>
              )}
            </div>
            <div className="p-4 bg-[#FAF6EE] flex items-center justify-end space-x-3 border-t border-[#EAD9B8]">
              <button
                disabled={actionLoading}
                onClick={() => setDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-[#6E5336] bg-white border border-[#EAD9B8] hover:bg-[#F3ECE0] transition"
              >
                {isPaidApp(appToDelete) ? 'Close' : 'Cancel'}
              </button>
              {!isPaidApp(appToDelete) && (
                <button
                  disabled={actionLoading}
                  onClick={handleSoftDelete}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition disabled:opacity-50"
                >
                  {actionLoading ? 'Moving...' : 'Move to Trash'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREMIUM HARD DELETE MODAL */}
      {/* ========================================================================= */}
      {hardDeleteModalOpen && appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#1A1208] rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.3)] border border-red-900/50 flex flex-col">
            <div className="p-6 bg-red-950/30 border-b border-red-900/50 text-center">
              <div className="w-16 h-16 bg-red-900/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-red-900/30">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-red-500">Permanent Deletion</h3>
            </div>
            <div className="p-6 text-center text-red-200/80">
              {isPaidApp(appToDelete) ? (
                <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-xs font-semibold space-y-1 text-left">
                  <div className="flex items-center space-x-2 font-bold text-sm text-red-400">
                    <Lock className="w-4 h-4 text-red-400" />
                    <span>Payment Completed</span>
                  </div>
                  <p>Application <strong className="font-mono text-white">{appToDelete.registrationNumber}</strong> has already completed payment or has active credentials. Permanent deletion is locked for financial audit integrity.</p>
                </div>
              ) : (
                <>
                  <p>You are about to <strong className="text-red-400">permanently delete</strong> application {appToDelete.registrationNumber}.</p>
                  <p className="mt-4 text-sm font-bold text-red-400">THIS ACTION CANNOT BE UNDONE. ALL RELATED DATA WILL BE DESTROYED.</p>
                </>
              )}
            </div>
            <div className="p-4 bg-[#0A0501] flex items-center justify-end space-x-3 border-t border-red-900/30">
              <button
                disabled={actionLoading}
                onClick={() => setHardDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-[#EAD9B8] bg-[#1A1208] border border-[#EAD9B8]/20 hover:bg-[#2D1F0E] transition"
              >
                {isPaidApp(appToDelete) ? 'Close' : 'Cancel'}
              </button>
              {!isPaidApp(appToDelete) && (
                <button
                  disabled={actionLoading}
                  onClick={handleHardDelete}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition disabled:opacity-50"
                >
                  {actionLoading ? 'Destroying...' : 'Yes, Delete Permanently'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREMIUM RESTORE MODAL */}
      {/* ========================================================================= */}
      {restoreModalOpen && appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-emerald-100 flex flex-col">
            <div className="p-6 bg-emerald-50 border-b border-emerald-100 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-emerald-900">Restore Application?</h3>
            </div>
            <div className="p-6 text-center text-[#6E5336]">
              <p>You are about to restore application <strong className="text-emerald-700">{appToDelete.registrationNumber}</strong> from the trash.</p>
              <p className="mt-2 text-sm">It will be moved back to the main applications list and removed from the Trash tab.</p>
            </div>
            <div className="p-4 bg-[#FAF6EE] flex items-center justify-end space-x-3 border-t border-[#EAD9B8]">
              <button
                disabled={actionLoading}
                onClick={() => setRestoreModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-[#6E5336] bg-white border border-[#EAD9B8] hover:bg-[#F3ECE0] transition"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleRestore}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
              >
                {actionLoading ? 'Restoring...' : 'Yes, Restore Now'}
              </button>
            </div>
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

      {/* ========================================================================= */}
      {/* SUPER ADMIN GAZEBO DIRECT BOOKING & ALLOCATION MODAL */}
      {/* ========================================================================= */}
      {selectedGazeboForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-[#EAD9B8] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-[#2D1F0E]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#EAD9B8] bg-gradient-to-r from-[#FFFDF9] via-[#FAF6EE] to-[#FFF9EE] flex justify-between items-start">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-[#2D1F0E] text-[#F6C85F] text-[9px] font-mono font-bold tracking-widest uppercase mb-1">
                  <span>✦ DIRECT VIP GAZEBO ALLOCATION ✦</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#2D1F0E]">
                  Book {selectedGazeboForBooking.gazeboNumber} (Level {selectedGazeboForBooking.level})
                </h3>
                <p className="text-xs text-[#6E5336] mt-0.5">
                  {selectedGazeboForBooking.level === 1 ? 'Sheri Chowk' : selectedGazeboForBooking.level === 2 ? 'The Royal Sheri Pavillion' : 'Sheri Rass'} • 14 VIP Guests Capacity
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGazeboForBooking(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#EAD9B8] text-[#6E5336] hover:text-[#2D1F0E] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleDirectBookingSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-3">
                {/* Host Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1">
                    VIP Host / Booker Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={bookingForm.fullName}
                    onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                    placeholder="e.g. Maharana Vikramaditya Solanki"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-semibold text-[#2D1F0E] focus:border-[#D99427] outline-none"
                  />
                </div>

                {/* WhatsApp Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1">
                      WhatsApp Phone (Optional)
                    </label>
                    <input
                      type="text"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-mono text-[#2D1F0E] focus:border-[#D99427] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                      placeholder="e.g. host@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-mono text-[#2D1F0E] focus:border-[#D99427] outline-none"
                    />
                  </div>
                </div>

                {/* Booking Status & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1">
                      Allocation Status
                    </label>
                    <select
                      value={bookingForm.status}
                      onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-bold text-[#2D1F0E] focus:border-[#D99427] outline-none"
                    >
                      <option value="CONFIRMED">🔴 CONFIRMED (Booked)</option>
                      <option value="HOLD">🟡 ON HOLD (Reserved)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1">
                      Agreed Price (₹)
                    </label>
                    <input
                      type="number"
                      value={bookingForm.amount}
                      onChange={(e) => setBookingForm({ ...bookingForm, amount: e.target.value })}
                      placeholder="100000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-mono font-bold text-[#2D1F0E] focus:border-[#D99427] outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1">
                    Special Concierge Notes & Arrangements (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    placeholder="e.g. VIP Sponsor table arrangement, premium catering requested"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#EAD9B8] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedGazeboForBooking(null)}
                  className="px-5 py-2.5 rounded-full border border-[#EAD9B8] text-[#6E5336] hover:bg-[#FAF6EE] text-xs font-bold uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] text-xs font-bold uppercase tracking-wider hover:scale-105 transition shadow-md disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{bookingLoading ? 'Saving Booking...' : 'Confirm & Lock Gazebo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUPER ADMIN GAZEBO MANAGE GUESTS MODAL */}
      {/* ========================================================================= */}
      {manageGuestsGazebo && (
        <GazeboManageGuestsModal
          gazebo={manageGuestsGazebo}
          onClose={() => setManageGuestsGazebo(null)}
          onSuccess={() => {
            setManageGuestsGazebo(null);
            loadTabContent('gazebos');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* PAYMENT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {paymentAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#2D1F0E]/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#FDFBF7] max-w-md w-full rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 border border-[#EAD9B8] relative overflow-hidden flex flex-col transform transition-all scale-100 animate-in zoom-in-95 duration-300">
            
            {/* Premium Header Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427]" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D99427]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#F6C85F]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF5DC] to-[#FAF6EE] border border-[#EAD9B8] shadow-sm flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#D99427] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#2D1F0E] leading-tight">Payment Status</h3>
                  <p className="text-[11px] font-bold text-[#D99427] uppercase tracking-wider">Action Required</p>
                </div>
              </div>
              <button onClick={() => setPaymentAction(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E5336] hover:bg-[#EAD9B8]/30 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative z-10 mb-8 p-4 bg-white rounded-2xl border border-[#EAD9B8] shadow-inner text-center">
              <p className="text-sm text-[#6E5336] leading-relaxed">
                Has the payment via <strong className="px-2 py-0.5 bg-[#FAF6EE] border border-[#EAD9B8] rounded text-[#D99427] mx-1 uppercase">{paymentAction.method.replace('_', ' ')}</strong> been successfully completed by the user?
              </p>
            </div>

            <div className="flex flex-col space-y-3 relative z-10">
              <button
                disabled={paymentActionLoading}
                onClick={async () => {
                  setPaymentActionLoading(true);
                  setMessage('');
                  setError('');
                  const res = await apiRequest(`/registrations/${paymentAction.row.id}/payment-method`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ method: paymentAction.method, isPaymentDone: true }),
                  });
                  setPaymentActionLoading(false);
                  setPaymentAction(null);
                  if (res.success) {
                    setMessage(res.message || 'Payment confirmed successfully.');
                    loadOverviewData(true);
                    loadTabContent('applications', true);
                  } else {
                    setError(res.error?.message || 'Failed to update payment method.');
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:scale-[1.02] transform transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {paymentActionLoading ? <span className="animate-pulse">Processing...</span> : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Yes, payment is done</span>
                  </>
                )}
              </button>
              
              <button
                disabled={paymentActionLoading}
                onClick={async () => {
                  setPaymentActionLoading(true);
                  setMessage('');
                  setError('');
                  const res = await apiRequest(`/registrations/${paymentAction.row.id}/payment-method`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ method: paymentAction.method, isPaymentDone: false }),
                  });
                  setPaymentActionLoading(false);
                  setPaymentAction(null);
                  if (res.success) {
                    setMessage(res.message || 'Payment requested successfully.');
                    loadOverviewData(true);
                    loadTabContent('applications', true);
                  } else {
                    setError(res.error?.message || 'Failed to update payment method.');
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold text-sm shadow-[0_4px_14px_0_rgba(251,191,36,0.39)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.23)] hover:scale-[1.02] transform transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {paymentActionLoading ? <span className="animate-pulse">Processing...</span> : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>No, request payment</span>
                  </>
                )}
              </button>
              
              <button
                disabled={paymentActionLoading}
                onClick={() => setPaymentAction(null)}
                className="w-full py-3 rounded-xl bg-transparent border border-[#EAD9B8] text-[#6E5336] font-bold text-sm hover:bg-[#FAF6EE] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
