'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest, getStoredUser } from '../../lib/api';
import LogoSlot from './LogoSlot';
import { 
  QrCode, Search, Printer, Download, Copy, Check, CheckCircle2, 
  Users, Crown, Sparkles, RefreshCw, Lock, ShieldCheck, Ticket, 
  Grid, List, AlertCircle, Eye, X, Phone, Calendar, Filter, RotateCcw
} from 'lucide-react';

interface MasterPassesQRViewProps {
  currentUser?: any;
}

export default function MasterPassesQRView({ currentUser: initialUser }: MasterPassesQRViewProps) {
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SINGLE' | 'COUPLE' | 'KIDS' | 'GAZEBO'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'USED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedPassForModal, setSelectedPassForModal] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      const u = getStoredUser();
      setCurrentUser(u);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.username === 'masteradmin@safedsheri.com') {
      loadAllCredentials();
    }
  }, [currentUser]);

  async function loadAllCredentials() {
    setLoading(true);
    setError('');
    const res = await apiRequest('/credentials');
    if (res.success && Array.isArray(res.data)) {
      setCredentials(res.data);
    } else {
      setError(res.error?.message || 'Failed to fetch credentials');
    }
    setLoading(false);
  }

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download QR SVG as PNG
  const handleDownloadQr = (cred: any) => {
    const svgElement = document.getElementById(`qr-svg-${cred.id}`);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 600;
    canvas.height = 600;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 500, 500);

        const a = document.createElement('a');
        a.download = `QR_${cred.passCode || cred.credentialNumber}_${cred.attendee?.fullName?.replace(/\s+/g, '_')}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
  };

  // Single Pass Print
  const handlePrintPass = (cred: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const passType = cred.registration?.passType || 'SINGLE';
    const attendeeName = cred.attendee?.fullName || 'Guest';
    const attendeePhone = cred.attendee?.phone || '';
    const aadhaarMasked = cred.attendee?.aadhaarMasked || 'XXXX-XXXX-XXXX';
    const passCode = cred.passCode || cred.credentialNumber;
    const regNum = cred.registration?.registrationNumber || '';

    const svgElement = document.getElementById(`qr-svg-${cred.id}`);
    const svgHtml = svgElement ? svgElement.outerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Safed Sheri 2026 Pass - ${passCode}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Inter:wght@400;600;700&display=swap');
            body {
              margin: 0;
              padding: 20px;
              background: #fff;
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
            }
            .pass-card {
              width: 380px;
              border: 3px solid #D99427;
              border-radius: 28px;
              padding: 30px;
              background: linear-gradient(180deg, #FFFDF9 0%, #FFFFFF 50%, #FAF6EE 100%);
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .brand {
              font-family: 'Cinzel', serif;
              font-size: 24px;
              font-weight: 800;
              color: #2D1F0E;
              letter-spacing: 2px;
              margin-bottom: 4px;
            }
            .sub-brand {
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 3px;
              color: #8C6019;
              text-transform: uppercase;
              margin-bottom: 16px;
            }
            .badge {
              display: inline-block;
              padding: 4px 14px;
              border-radius: 999px;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              background: #FFF5DC;
              color: #8C6019;
              border: 1px solid #E5A93C;
              margin-bottom: 20px;
            }
            .guest-name {
              font-family: 'Cinzel', serif;
              font-size: 20px;
              font-weight: 700;
              color: #2D1F0E;
              margin-bottom: 4px;
            }
            .guest-details {
              font-size: 11px;
              color: #6E5336;
              font-family: monospace;
              margin-bottom: 20px;
            }
            .qr-wrapper {
              background: #fff;
              border: 2px dashed #EAD9B8;
              border-radius: 20px;
              padding: 16px;
              display: inline-block;
              margin-bottom: 20px;
            }
            .pass-code {
              font-family: monospace;
              font-size: 13px;
              font-weight: 700;
              color: #2D1F0E;
              letter-spacing: 1px;
              background: #FAF6EE;
              padding: 6px 12px;
              border-radius: 8px;
              display: inline-block;
              margin-bottom: 8px;
            }
            .footer-notes {
              font-size: 10px;
              color: #8C6019;
              line-height: 1.4;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="pass-card">
            <div class="brand">SAFED SHERI</div>
            <div class="sub-brand">RAJIKOT • 2026 FESTIVAL</div>
            <div class="badge">${passType} PASS</div>
            <div class="guest-name">${attendeeName}</div>
            <div class="guest-details">${attendeePhone} • ${aadhaarMasked}</div>
            <div class="qr-wrapper">${svgHtml}</div>
            <div>
              <div class="pass-code">${passCode}</div>
            </div>
            <div style="font-size: 10px; color: #6E5336; font-family: monospace;">App #${regNum}</div>
            <div class="footer-notes">
              Mandatory 75% White Traditional Attire Compulsory.<br/>
              Valid for Verified Gate Entry on 9th October 2026.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Batch Print All Filtered
  const handleBatchPrint = () => {
    window.print();
  };

  // Filtered dataset
  const filteredCredentials = useMemo(() => {
    return credentials.filter((cred) => {
      // Category filter
      if (categoryFilter !== 'ALL') {
        const pt = cred.registration?.passType;
        if (pt !== categoryFilter) return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && cred.status !== 'ACTIVE') return false;
      if (statusFilter === 'USED' && cred.status !== 'USED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (cred.attendee?.fullName || '').toLowerCase();
        const phone = (cred.attendee?.phone || '').toLowerCase();
        const code = (cred.passCode || '').toLowerCase();
        const credNum = (cred.credentialNumber || '').toLowerCase();
        const regNum = (cred.registration?.registrationNumber || '').toLowerCase();
        const aadhaar = (cred.attendee?.aadhaarMasked || '').toLowerCase();

        return (
          name.includes(q) ||
          phone.includes(q) ||
          code.includes(q) ||
          credNum.includes(q) ||
          regNum.includes(q) ||
          aadhaar.includes(q)
        );
      }

      return true;
    });
  }, [credentials, categoryFilter, statusFilter, searchQuery]);

  // Metric counts
  const counts = useMemo(() => {
    const single = credentials.filter((c) => c.registration?.passType === 'SINGLE').length;
    const couple = credentials.filter((c) => c.registration?.passType === 'COUPLE').length;
    const kids = credentials.filter((c) => c.registration?.passType === 'KIDS').length;
    const gazebo = credentials.filter((c) => c.registration?.passType === 'GAZEBO').length;
    const used = credentials.filter((c) => c.status === 'USED' || (c.entries && c.entries.length > 0)).length;

    return {
      total: credentials.length,
      single,
      couple,
      kids,
      gazebo,
      used,
    };
  }, [credentials]);

  // ACCESS DENIED PROTECTION FOR NON-MASTER-ADMIN
  if (currentUser && currentUser.username !== 'masteradmin@safedsheri.com') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border-2 border-rose-200 shadow-xl space-y-5">
        <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-300 flex items-center justify-center text-rose-600 shadow-md">
          <Lock className="w-10 h-10" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-serif font-bold text-[#2D1F0E]">ACCESS RESTRICTED</h2>
          <p className="text-xs text-[#6E5336] leading-relaxed">
            The Master QR Passes Terminal is exclusively restricted to the primary <strong>Master Admin</strong> account (<code className="bg-[#FAF6EE] px-2 py-0.5 rounded text-rose-700 font-mono">masteradmin@safedsheri.com</code>).
          </p>
          <p className="text-[11px] text-gray-500">
            Current user: <strong className="font-mono text-[#2D1F0E]">{currentUser.username}</strong> ({currentUser.role})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#2D1F0E] animate-fade-in pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#EAD9B8] pb-6">
        <div className="flex items-center space-x-4">
          <LogoSlot size="md" />
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFF5DC] border border-[#E5A93C] mb-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D99427]" />
              <span className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-wider">
                MASTER ADMIN EXCLUSIVE • PASS QR REPOSITORY
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F0E] flex items-center gap-2">
              All Passes QR Directory
            </h1>
            <p className="text-xs text-[#6E5336]">
              Real-Time Scannable Digital Passes for Single Female, Couple, Kids &amp; Gazebo VIP tiers
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadAllCredentials()}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-bold text-[#2D1F0E] flex items-center space-x-2 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D99427] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh ({counts.total})</span>
          </button>

          <button
            onClick={handleBatchPrint}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-md hover:opacity-95 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Filtered ({filteredCredentials.length})</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card: ALL */}
        <div 
          onClick={() => setCategoryFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
            categoryFilter === 'ALL'
              ? 'bg-gradient-to-br from-[#2D1F0E] to-[#1F1710] text-white border-2 border-[#D99427] shadow-lg ring-2 ring-[#D99427]/40 scale-[1.02]'
              : 'bg-white hover:bg-[#FAF6EE] text-[#2D1F0E] border border-[#EAD9B8] hover:border-[#D99427] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              categoryFilter === 'ALL' ? 'text-[#F6C85F]' : 'text-[#8C6019]'
            }`}>
              ALL PASSES
            </span>
            {categoryFilter === 'ALL' && (
              <span className="w-2 h-2 rounded-full bg-[#D99427] animate-pulse" />
            )}
          </div>
          <div className={`text-2xl font-serif font-bold my-1 ${
            categoryFilter === 'ALL' ? 'text-white' : 'text-[#2D1F0E]'
          }`}>
            {counts.total}
          </div>
          <div className={`text-[10px] ${
            categoryFilter === 'ALL' ? 'text-[#FAF6EE]/80' : 'text-[#6E5336]'
          }`}>
            Total Passes Issued
          </div>
        </div>

        {/* Card: SINGLE FEMALE */}
        <div 
          onClick={() => setCategoryFilter('SINGLE')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
            categoryFilter === 'SINGLE'
              ? 'bg-gradient-to-br from-purple-800 to-indigo-900 text-white border-2 border-purple-400 shadow-lg ring-2 ring-purple-400/50 scale-[1.02]'
              : 'bg-purple-50/50 hover:bg-purple-100/60 text-purple-950 border border-purple-200 hover:border-purple-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              categoryFilter === 'SINGLE' ? 'text-purple-200' : 'text-purple-800'
            }`}>
              🌸 SINGLE FEMALE
            </span>
            {categoryFilter === 'SINGLE' && (
              <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse" />
            )}
          </div>
          <div className={`text-2xl font-serif font-bold my-1 ${
            categoryFilter === 'SINGLE' ? 'text-white' : 'text-purple-950'
          }`}>
            {counts.single}
          </div>
          <div className={`text-[10px] ${
            categoryFilter === 'SINGLE' ? 'text-purple-200/90' : 'text-purple-700'
          }`}>
            1 Attendee per Pass
          </div>
        </div>

        {/* Card: COUPLE PASSES */}
        <div 
          onClick={() => setCategoryFilter('COUPLE')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
            categoryFilter === 'COUPLE'
              ? 'bg-gradient-to-br from-[#8C6019] to-[#5C3C0C] text-white border-2 border-[#F6C85F] shadow-lg ring-2 ring-[#E5A93C]/50 scale-[1.02]'
              : 'bg-amber-50/50 hover:bg-amber-100/60 text-amber-950 border border-amber-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              categoryFilter === 'COUPLE' ? 'text-[#F6C85F]' : 'text-amber-800'
            }`}>
              💑 COUPLE PASSES
            </span>
            {categoryFilter === 'COUPLE' && (
              <span className="w-2 h-2 rounded-full bg-[#F6C85F] animate-pulse" />
            )}
          </div>
          <div className={`text-2xl font-serif font-bold my-1 ${
            categoryFilter === 'COUPLE' ? 'text-white' : 'text-amber-950'
          }`}>
            {counts.couple}
          </div>
          <div className={`text-[10px] ${
            categoryFilter === 'COUPLE' ? 'text-amber-100/90' : 'text-amber-700'
          }`}>
            2 Attendees (F+M)
          </div>
        </div>

        {/* Card: KIDS PASSES */}
        <div 
          onClick={() => setCategoryFilter('KIDS')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
            categoryFilter === 'KIDS'
              ? 'bg-gradient-to-br from-emerald-800 to-teal-900 text-white border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-400/50 scale-[1.02]'
              : 'bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-950 border border-emerald-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              categoryFilter === 'KIDS' ? 'text-emerald-200' : 'text-emerald-800'
            }`}>
              🧒 KIDS PASSES
            </span>
            {categoryFilter === 'KIDS' && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            )}
          </div>
          <div className={`text-2xl font-serif font-bold my-1 ${
            categoryFilter === 'KIDS' ? 'text-white' : 'text-emerald-950'
          }`}>
            {counts.kids}
          </div>
          <div className={`text-[10px] ${
            categoryFilter === 'KIDS' ? 'text-emerald-100/90' : 'text-emerald-700'
          }`}>
            Children Entry
          </div>
        </div>

        {/* Card: GAZEBO VIP */}
        <div 
          onClick={() => setCategoryFilter('GAZEBO')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
            categoryFilter === 'GAZEBO'
              ? 'bg-gradient-to-br from-[#2D1F0E] via-[#3d2a13] to-[#1F1710] text-[#F6C85F] border-2 border-[#D99427] shadow-lg ring-2 ring-[#D99427]/60 scale-[1.02]'
              : 'bg-[#FFFDF9] hover:bg-[#FAF6EE] text-[#2D1F0E] border border-[#EAD9B8] hover:border-[#D99427] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              categoryFilter === 'GAZEBO' ? 'text-[#F6C85F]' : 'text-[#8C6019]'
            }`}>
              👑 GAZEBO VIP
            </span>
            {categoryFilter === 'GAZEBO' && (
              <span className="w-2 h-2 rounded-full bg-[#D99427] animate-pulse" />
            )}
          </div>
          <div className={`text-2xl font-serif font-bold my-1 ${
            categoryFilter === 'GAZEBO' ? 'text-[#F6C85F]' : 'text-[#2D1F0E]'
          }`}>
            {counts.gazebo}
          </div>
          <div className={`text-[10px] ${
            categoryFilter === 'GAZEBO' ? 'text-[#FAF6EE]/80' : 'text-[#6E5336]'
          }`}>
            VIP Cabana Passes
          </div>
        </div>

        {/* Card: GATE SCANNED */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'USED' ? 'ALL' : 'USED')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
            statusFilter === 'USED'
              ? 'bg-gradient-to-br from-blue-700 to-indigo-900 text-white border-2 border-blue-400 shadow-lg ring-2 ring-blue-400/50 scale-[1.02]'
              : 'bg-blue-50/50 hover:bg-blue-100/60 text-blue-950 border border-blue-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              statusFilter === 'USED' ? 'text-blue-200' : 'text-blue-800'
            }`}>
              🛡️ GATE SCANNED
            </span>
            {statusFilter === 'USED' && (
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
            )}
          </div>
          <div className={`text-2xl font-serif font-bold my-1 ${
            statusFilter === 'USED' ? 'text-white' : 'text-blue-950'
          }`}>
            {counts.used}
          </div>
          <div className={`text-[10px] ${
            statusFilter === 'USED' ? 'text-blue-100/90' : 'text-blue-700'
          }`}>
            Entries Checked-In
          </div>
        </div>
      </div>

      {/* CATEGORY QUICK FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8C6019] mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Category Filter:</span>
        </span>
        
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
            categoryFilter === 'ALL'
              ? 'bg-[#2D1F0E] text-white shadow-sm ring-1 ring-[#D99427]'
              : 'bg-white hover:bg-[#FAF6EE] text-[#6E5336] border border-[#EAD9B8]'
          }`}
        >
          <span>All Categories</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#FAF6EE] text-[#8C6019]'}`}>
            {counts.total}
          </span>
        </button>

        <button
          onClick={() => setCategoryFilter('SINGLE')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
            categoryFilter === 'SINGLE'
              ? 'bg-purple-900 text-white shadow-sm ring-1 ring-purple-400'
              : 'bg-white hover:bg-purple-50 text-purple-900 border border-purple-200'
          }`}
        >
          <span>🌸 Single Female</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === 'SINGLE' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}`}>
            {counts.single}
          </span>
        </button>

        <button
          onClick={() => setCategoryFilter('COUPLE')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
            categoryFilter === 'COUPLE'
              ? 'bg-[#8C6019] text-white shadow-sm ring-1 ring-[#F6C85F]'
              : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          <span>💑 Couple</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === 'COUPLE' ? 'bg-[#5C3C0C] text-white' : 'bg-amber-100 text-amber-800'}`}>
            {counts.couple}
          </span>
        </button>

        <button
          onClick={() => setCategoryFilter('KIDS')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
            categoryFilter === 'KIDS'
              ? 'bg-emerald-900 text-white shadow-sm ring-1 ring-emerald-400'
              : 'bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          <span>🧒 Kids</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === 'KIDS' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            {counts.kids}
          </span>
        </button>

        <button
          onClick={() => setCategoryFilter('GAZEBO')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
            categoryFilter === 'GAZEBO'
              ? 'bg-[#2D1F0E] text-[#F6C85F] shadow-sm ring-1 ring-[#D99427]'
              : 'bg-white hover:bg-amber-50 text-[#8C6019] border border-[#EAD9B8]'
          }`}
        >
          <span>👑 Gazebo VIP</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === 'GAZEBO' ? 'bg-[#D99427] text-[#2D1F0E]' : 'bg-[#FFF5DC] text-[#8C6019]'}`}>
            {counts.gazebo}
          </span>
        </button>

        {(categoryFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center space-x-1 ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAD9B8] shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6019]" />
          <input
            type="text"
            placeholder="Search by Guest Name, WhatsApp Phone, Pass Code (SS26-...), App #, or Aadhaar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-medium text-[#2D1F0E] placeholder:text-gray-400 focus:border-[#D99427] focus:bg-white outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters and View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-mono font-bold uppercase text-[#8C6019] hidden sm:inline">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3.5 py-2.5 bg-[#FAF6EE] hover:bg-white focus:bg-white border border-[#EAD9B8] focus:border-[#D99427] rounded-xl text-xs font-bold text-[#2D1F0E] outline-none cursor-pointer transition shadow-xs"
            >
              <option value="ALL">All Categories ({counts.total})</option>
              <option value="SINGLE">🌸 Single Female ({counts.single})</option>
              <option value="COUPLE">💑 Couple ({counts.couple})</option>
              <option value="KIDS">🧒 Kids ({counts.kids})</option>
              <option value="GAZEBO">👑 Gazebo VIP ({counts.gazebo})</option>
            </select>
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-mono font-bold uppercase text-[#8C6019] hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3.5 py-2.5 bg-[#FAF6EE] hover:bg-white focus:bg-white border border-[#EAD9B8] focus:border-[#D99427] rounded-xl text-xs font-bold text-[#2D1F0E] outline-none cursor-pointer transition shadow-xs"
            >
              <option value="ALL">All Statuses ({counts.total})</option>
              <option value="ACTIVE">Active Passes Only</option>
              <option value="USED">Scanned / Used Only ({counts.used})</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#FAF6EE] border border-[#EAD9B8] rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white shadow text-[#D99427]' : 'text-[#6E5336] hover:text-[#2D1F0E]'
              }`}
              title="Pass Cards Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white shadow text-[#D99427]' : 'text-[#6E5336] hover:text-[#2D1F0E]'
              }`}
              title="Compact Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER RESULT STATUS BADGE */}
      <div className="flex items-center justify-between text-xs text-[#6E5336] px-1">
        <div className="flex items-center space-x-2">
          <span>Showing <strong className="text-[#2D1F0E]">{filteredCredentials.length}</strong> of <strong className="text-[#2D1F0E]">{counts.total}</strong> total passes</span>
          {categoryFilter !== 'ALL' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6EE] border border-[#EAD9B8] text-[#8C6019]">
              Filter: {categoryFilter === 'SINGLE' ? 'Single Female' : categoryFilter === 'COUPLE' ? 'Couple' : categoryFilter === 'KIDS' ? 'Kids' : 'Gazebo VIP'}
            </span>
          )}
          {statusFilter !== 'ALL' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-800">
              Status: {statusFilter}
            </span>
          )}
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-rose-700" /></button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#D99427] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#8C6019] tracking-wider uppercase">Loading All Passes &amp; QR Codes...</p>
        </div>
      ) : filteredCredentials.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-[#EAD9B8]">
          <div className="w-16 h-16 rounded-full bg-[#FFF5DC] flex items-center justify-center text-[#8C6019] mx-auto text-2xl font-bold">
            🎟️
          </div>
          <h3 className="text-lg font-serif font-bold text-[#2D1F0E]">No Passes Found</h3>
          <p className="text-xs text-[#6E5336] max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No passes match the current filter criteria. Try resetting filters.'
              : 'No digital passes have been generated yet.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ========================================================================= */
        /* VIEW 1: PASS CARDS GRID */
        /* ========================================================================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCredentials.map((cred) => {
            const passType = cred.registration?.passType || 'SINGLE';
            const attendeeName = cred.attendee?.fullName || 'Guest Attendee';
            const attendeePhone = cred.attendee?.phone || '';
            const aadhaarMasked = cred.attendee?.aadhaarMasked || 'XXXX XXXX XXXX';
            const passCode = cred.passCode || cred.credentialNumber;
            const isUsed = cred.status === 'USED' || (cred.entries && cred.entries.length > 0);
            const tokenValue = cred.secureToken || cred.passCode;

            return (
              <div
                key={cred.id}
                className="rounded-3xl bg-gradient-to-b from-[#FFFDF9] via-white to-[#FAF6EE] border-2 border-[#D99427] p-5 text-center flex flex-col justify-between shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              >
                {/* Decorative Top Arch Border */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427]" />

                <div>
                  {/* Category Pill & Status Badge */}
                  <div className="flex items-center justify-between mb-3 pt-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                        passType === 'SINGLE'
                          ? 'bg-purple-100 text-purple-900 border-purple-200'
                          : passType === 'COUPLE'
                          ? 'bg-[#FFF5DC] text-[#8C6019] border-[#E5A93C]'
                          : passType === 'KIDS'
                          ? 'bg-amber-100 text-amber-900 border-amber-200'
                          : 'bg-[#2D1F0E] text-[#F6C85F] border-[#D99427]'
                      }`}
                    >
                      {passType} PASS
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        isUsed
                          ? 'bg-blue-100 text-blue-800'
                          : cred.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isUsed ? '✓ SCANNED' : cred.status}
                    </span>
                  </div>

                  {/* Attendee Name & Details */}
                  <h4 className="font-serif font-bold text-base text-[#2D1F0E] truncate" title={attendeeName}>
                    {attendeeName}
                  </h4>
                  <div className="text-[11px] text-[#6E5336] font-mono mt-0.5">
                    {attendeePhone}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {aadhaarMasked} {cred.attendee?.gender && `• ${cred.attendee.gender}`}
                  </div>

                  {/* SCANNABLE QR CODE CONTAINER */}
                  <div className="my-4 p-3 bg-white border border-[#EAD9B8] rounded-2xl shadow-inner inline-block mx-auto relative group-hover:border-[#D99427] transition">
                    <QRCodeSVG
                      id={`qr-svg-${cred.id}`}
                      value={tokenValue}
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Pass Code Badge */}
                  <div className="bg-[#FAF6EE] border border-[#EAD9B8] py-1.5 px-2.5 rounded-xl font-mono text-[11px] font-bold text-[#2D1F0E] tracking-wider mb-1 flex items-center justify-between">
                    <span className="truncate">{passCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(passCode, cred.id)}
                      className="p-1 hover:text-[#D99427] text-gray-400"
                      title="Copy Pass Code"
                    >
                      {copiedId === cred.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="text-[10px] text-[#6E5336] font-mono mb-3">
                    App #{cred.registration?.registrationNumber || '—'}
                  </div>
                </div>

                {/* CARD ACTIONS */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#EAD9B8]">
                  <button
                    type="button"
                    onClick={() => handlePrintPass(cred)}
                    className="py-1.5 px-2 rounded-xl bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[10px] font-bold text-[#2D1F0E] flex items-center justify-center space-x-1 transition shadow-sm"
                    title="Print Pass Ticket"
                  >
                    <Printer className="w-3 h-3 text-[#D99427]" />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadQr(cred)}
                    className="py-1.5 px-2 rounded-xl bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[10px] font-bold text-[#2D1F0E] flex items-center justify-center space-x-1 transition shadow-sm"
                    title="Download QR PNG"
                  >
                    <Download className="w-3 h-3 text-[#D99427]" />
                    <span>QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPassForModal(cred)}
                    className="py-1.5 px-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[10px] font-bold text-[#6E5336] flex items-center justify-center space-x-1 transition"
                    title="Inspect Full Details"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: COMPACT TABULAR TABLE */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl border border-[#EAD9B8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2D1F0E]">
              <thead className="bg-[#FAF6EE] border-b border-[#EAD9B8] text-[10px] font-bold text-[#6E5336] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">QR</th>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Guest Attendee</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Aadhaar</th>
                  <th className="py-3 px-4">App #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAD9B8]">
                {filteredCredentials.map((cred) => {
                  const passType = cred.registration?.passType || 'SINGLE';
                  const isUsed = cred.status === 'USED' || (cred.entries && cred.entries.length > 0);

                  return (
                    <tr key={cred.id} className="hover:bg-[#FFFDF9] transition">
                      <td className="py-2.5 px-4">
                        <div 
                          onClick={() => setSelectedPassForModal(cred)}
                          className="w-10 h-10 p-1 bg-white border border-[#EAD9B8] rounded-lg cursor-pointer hover:border-[#D99427] transition shrink-0"
                        >
                          <QRCodeSVG
                            id={`qr-svg-${cred.id}`}
                            value={cred.secureToken || cred.passCode}
                            size={32}
                            level="M"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#2D1F0E]">
                        {cred.passCode || cred.credentialNumber}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            passType === 'SINGLE'
                              ? 'bg-purple-100 text-purple-900'
                              : passType === 'COUPLE'
                              ? 'bg-amber-100 text-amber-900'
                              : passType === 'KIDS'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-[#2D1F0E] text-[#F6C85F]'
                          }`}
                        >
                          {passType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#2D1F0E]">
                        {cred.attendee?.fullName || 'Guest'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#6E5336]">
                        {cred.attendee?.phone || '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#6E5336]">
                        {cred.attendee?.aadhaarMasked || '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#6E5336]">
                        {cred.registration?.registrationNumber || '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isUsed ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isUsed ? 'Scanned' : cred.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handlePrintPass(cred)}
                          className="px-2 py-1 rounded bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] font-bold text-[10px]"
                        >
                          Print
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadQr(cred)}
                          className="px-2 py-1 rounded bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] font-bold text-[10px]"
                        >
                          QR
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED PASS MODAL */}
      {selectedPassForModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedPassForModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl border-2 border-[#D99427] p-6 text-center space-y-4 shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedPassForModal(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#FFF5DC] border border-[#E5A93C] flex items-center justify-center mx-auto text-[#8C6019]">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFF5DC] text-[#8C6019] border border-[#E5A93C]">
                {selectedPassForModal.registration?.passType} PASS
              </span>
              <h3 className="text-xl font-serif font-bold text-[#2D1F0E] mt-2">
                {selectedPassForModal.attendee?.fullName}
              </h3>
              <p className="text-xs text-[#6E5336] font-mono">
                {selectedPassForModal.attendee?.phone} • {selectedPassForModal.attendee?.aadhaarMasked}
              </p>
            </div>

            <div className="p-4 bg-white border-2 border-dashed border-[#D99427] rounded-3xl inline-block mx-auto shadow-inner">
              <QRCodeSVG
                value={selectedPassForModal.secureToken || selectedPassForModal.passCode}
                size={200}
                level="H"
              />
            </div>

            <div className="space-y-1.5 text-xs text-left bg-[#FAF6EE] p-4 rounded-2xl border border-[#EAD9B8]">
              <div className="flex justify-between">
                <span className="text-[#6E5336]">Pass Code:</span>
                <span className="font-mono font-bold text-[#2D1F0E]">{selectedPassForModal.passCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E5336]">Credential #:</span>
                <span className="font-mono text-[#2D1F0E]">{selectedPassForModal.credentialNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E5336]">Application #:</span>
                <span className="font-mono text-[#2D1F0E]">{selectedPassForModal.registration?.registrationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E5336]">Status:</span>
                <span className="font-bold text-emerald-800">{selectedPassForModal.status}</span>
              </div>
              {selectedPassForModal.entries && selectedPassForModal.entries.length > 0 && (
                <div className="flex justify-between border-t border-[#EAD9B8] pt-1.5 mt-1.5">
                  <span className="text-[#6E5336]">Gate Check-In:</span>
                  <span className="font-mono font-bold text-blue-900">
                    {new Date(selectedPassForModal.entries[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => handlePrintPass(selectedPassForModal)}
                className="flex-1 py-3 bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pass Card</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadQr(selectedPassForModal)}
                className="flex-1 py-3 bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download QR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
