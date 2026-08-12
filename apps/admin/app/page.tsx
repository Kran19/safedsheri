'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Ticket, Crown, X, AlertTriangle, Building2, Store, Lock, Volume2, VolumeX, CheckCircle2, User, Phone, Mail, CreditCard, ArrowRight, QrCode, ChevronRight, ChevronDown, Shield } from 'lucide-react';
import FrameCanvasEngine from './components/FrameCanvasEngine';
import WhiteTigressMotif from './components/WhiteTigressMotif';
import LogoSlot from './components/LogoSlot';
import { garbaAudio } from './components/GarbaAudioService';
import { apiRequest } from '../lib/api';

interface ActivePhaseData {
  id: string;
  phaseName: string;
  singlePrice: number;
  couplePrice: number;
}

interface GazeboAvailabilityData {
  level1: { level: number; price: number; total: number; available: number };
  level2: { level: number; price: number; total: number; available: number };
  level3: { level: number; price: number; total: number; available: number };
}

export default function SafedSheriPublicExperience() {
  const [loading, setLoading] = useState(true);
  const [preloadInfo, setPreloadInfo] = useState({ loaded: 0, total: 330, complete: false });

  const [activeDrawer, setActiveDrawer] = useState<'NONE' | 'GET_PASS' | 'MY_PASS' | 'GAZEBO' | 'SPONSOR' | 'STALL'>('NONE');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  const [activePhase, setActivePhase] = useState<ActivePhaseData>({
    id: 'early_bird',
    phaseName: 'EARLY_BIRD',
    singlePrice: 3500,
    couplePrice: 6500,
  });

  const [gazeboAvailability, setGazeboAvailability] = useState<GazeboAvailabilityData>({
    level1: { level: 1, price: 85000, total: 4, available: 4 },
    level2: { level: 2, price: 100000, total: 4, available: 4 },
    level3: { level: 3, price: 125000, total: 4, available: 4 },
  });

  // Form States
  const [selectedGazeboLevel, setSelectedGazeboLevel] = useState<number | null>(null);
  const [gazeboName, setGazeboName] = useState('');
  const [gazeboPhone, setGazeboPhone] = useState('');
  const [gazeboNotes, setGazeboNotes] = useState('');
  const [gazeboSubmitting, setGazeboSubmitting] = useState(false);
  const [gazeboInquiryResult, setGazeboInquiryResult] = useState<any>(null);
  const [gazeboError, setGazeboError] = useState('');

  const [sponsorCompany, setSponsorCompany] = useState('');
  const [sponsorContact, setSponsorContact] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');
  const [sponsorEmail, setSponsorEmail] = useState('');
  const [sponsorType, setSponsorType] = useState('TITLE_SPONSOR');
  const [sponsorNotes, setSponsorNotes] = useState('');
  const [sponsorSubmitting, setSponsorSubmitting] = useState(false);
  const [sponsorResult, setSponsorResult] = useState<any>(null);
  const [sponsorError, setSponsorError] = useState('');

  const [stallBrand, setStallBrand] = useState('');
  const [stallContact, setStallContact] = useState('');
  const [stallPhone, setStallPhone] = useState('');
  const [stallCategory, setStallCategory] = useState('FOOD_BEVERAGE');
  const [stallNotes, setStallNotes] = useState('');
  const [stallSubmitting, setStallSubmitting] = useState(false);
  const [stallResult, setStallResult] = useState<any>(null);
  const [stallError, setStallError] = useState('');

  const [passStep, setPassStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPassType, setSelectedPassType] = useState<'SINGLE' | 'COUPLE'>('SINGLE');

  const [att1Name, setAtt1Name] = useState('');
  const [att1Phone, setAtt1Phone] = useState('');
  const [att1Email, setAtt1Email] = useState('');
  const [att1Aadhaar, setAtt1Aadhaar] = useState('');

  const [att2Name, setAtt2Name] = useState('');
  const [att2Phone, setAtt2Phone] = useState('');
  const [att2Email, setAtt2Email] = useState('');
  const [att2Aadhaar, setAtt2Aadhaar] = useState('');

  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerifiedToken, setOtpVerifiedToken] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const [myPassPhone, setMyPassPhone] = useState('');
  const [myPassOtp, setMyPassOtp] = useState('');
  const [myPassOtpSent, setMyPassOtpSent] = useState(false);
  const [myPassVerifiedToken, setMyPassVerifiedToken] = useState('');
  const [myPassData, setMyPassData] = useState<any[] | null>(null);
  const [myPassLoading, setMyPassLoading] = useState(false);
  const [myPassError, setMyPassError] = useState('');

  useEffect(() => {
    async function fetchInitialData() {
      const resPhase = await apiRequest('/registrations/active-phase');
      if (resPhase.success && resPhase.data) {
        setActivePhase(resPhase.data);
      }
      const resGazebo = await apiRequest('/gazebos/availability');
      if (resGazebo.success && resGazebo.data) {
        setGazeboAvailability(resGazebo.data);
      }
    }
    fetchInitialData();

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleFramePreloadProgress = (loaded: number, total: number, complete: boolean) => {
    setPreloadInfo({ loaded, total, complete });
    if (loaded >= 15 && loading) {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleButtonClick = (action?: () => void) => {
    garbaAudio.playDandiyaTap();
    if (action) action();
  };

  const toggleAudioMute = () => {
    const muted = garbaAudio.toggleMute();
    setIsAudioMuted(muted);
  };

  async function handleSendWhatsAppOtp() {
    setOtpError('');
    if (!att1Phone || att1Phone.trim().length < 10) {
      setOtpError('Please enter a valid WhatsApp phone number for Primary Attendee');
      return;
    }
    const res = await apiRequest('/auth/whatsapp-otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone: att1Phone }),
    });
    if (res.success) {
      setOtpSent(true);
    } else {
      setOtpError(res.error?.message || 'Failed to send WhatsApp OTP');
    }
  }

  async function handleVerifyWhatsAppOtp() {
    setOtpError('');
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError('Please enter the 6-digit OTP sent to your WhatsApp');
      return;
    }
    const res = await apiRequest('/auth/whatsapp-otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone: att1Phone, code: otpCode }),
    });
    if (res.success && res.data) {
      setOtpVerifiedToken(res.data.otpToken);
      setPassStep(4);
      handleCreatePublicBooking();
    } else {
      setOtpError(res.error?.message || 'Invalid OTP code. Please try again.');
    }
  }

  async function handleCreatePublicBooking() {
    setIsSubmitting(true);
    setOtpError('');

    const attendeesPayload = [
      {
        fullName: att1Name,
        phone: att1Phone,
        email: att1Email || undefined,
        aadhaarNumber: att1Aadhaar,
      },
    ];

    if (selectedPassType === 'COUPLE') {
      attendeesPayload.push({
        fullName: att2Name,
        phone: att2Phone || att1Phone,
        email: att2Email || undefined,
        aadhaarNumber: att2Aadhaar,
      });
    }

    const res = await apiRequest('/registrations/public', {
      method: 'POST',
      body: JSON.stringify({
        passType: selectedPassType,
        attendees: attendeesPayload,
        otpToken: otpVerifiedToken,
      }),
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      setBookingResult(res.data);
    } else {
      setOtpError(res.error?.message || 'Booking creation failed. Please check details.');
    }
  }

  async function handleSendMyPassOtp() {
    setMyPassError('');
    if (!myPassPhone || myPassPhone.trim().length < 10) {
      setMyPassError('Please enter a valid WhatsApp phone number');
      return;
    }
    const res = await apiRequest('/auth/whatsapp-otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone: myPassPhone }),
    });
    if (res.success) {
      setMyPassOtpSent(true);
    } else {
      setMyPassError(res.error?.message || 'Failed to send WhatsApp OTP');
    }
  }

  async function handleVerifyMyPassOtp() {
    setMyPassError('');
    if (!myPassOtp || myPassOtp.trim().length < 6) {
      setMyPassError('Please enter the 6-digit OTP code');
      return;
    }
    setMyPassLoading(true);
    const resVerify = await apiRequest('/auth/whatsapp-otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone: myPassPhone, code: myPassOtp }),
    });

    if (resVerify.success && resVerify.data) {
      setMyPassVerifiedToken(resVerify.data.otpToken);
      const resPass = await apiRequest('/credentials/my-pass', {
        method: 'POST',
        body: JSON.stringify({ phone: myPassPhone, otpToken: resVerify.data.otpToken }),
      });
      setMyPassLoading(false);
      if (resPass.success) {
        setMyPassData(resPass.data || []);
      } else {
        setMyPassError(resPass.error?.message || 'Could not retrieve pass details.');
      }
    } else {
      setMyPassLoading(false);
      setMyPassError(resVerify.error?.message || 'Invalid OTP code.');
    }
  }

  async function handleSubmitGazeboInquiry(levelNum: number) {
    setGazeboError('');
    if (!gazeboName || gazeboName.trim().length === 0) {
      setGazeboError('Full name is required to submit a Gazebo inquiry');
      return;
    }
    if (!gazeboPhone || gazeboPhone.trim().length < 10) {
      setGazeboError('Valid WhatsApp phone number is required');
      return;
    }

    setGazeboSubmitting(true);
    const res = await apiRequest('/gazebo-inquiries', {
      method: 'POST',
      body: JSON.stringify({
        level: levelNum,
        fullName: gazeboName,
        phone: gazeboPhone,
        notes: gazeboNotes || undefined,
      }),
    });
    setGazeboSubmitting(false);

    if (res.success && res.data) {
      setGazeboInquiryResult(res.data);
    } else {
      setGazeboError(res.error?.message || 'Inquiry submission failed. Please try again.');
    }
  }

  async function handleSubmitSponsorInquiry() {
    setSponsorError('');
    if (!sponsorCompany || !sponsorContact || !sponsorPhone) {
      setSponsorError('Company name, contact person name, and WhatsApp phone number are required');
      return;
    }
    setSponsorSubmitting(true);
    const res = await apiRequest('/sponsor-inquiries', {
      method: 'POST',
      body: JSON.stringify({
        companyName: sponsorCompany,
        contactName: sponsorContact,
        phone: sponsorPhone,
        email: sponsorEmail || undefined,
        sponsorshipType: sponsorType,
        notes: sponsorNotes || undefined,
      }),
    });
    setSponsorSubmitting(false);
    if (res.success && res.data) {
      setSponsorResult(res.data);
    } else {
      setSponsorError(res.error?.message || 'Sponsorship application submission failed.');
    }
  }

  async function handleSubmitStallInquiry() {
    setStallError('');
    if (!stallBrand || !stallContact || !stallPhone) {
      setStallError('Brand name, contact person name, and WhatsApp phone number are required');
      return;
    }
    setStallSubmitting(true);
    const res = await apiRequest('/stall-inquiries', {
      method: 'POST',
      body: JSON.stringify({
        brandName: stallBrand,
        contactName: stallContact,
        phone: stallPhone,
        category: stallCategory,
        notes: stallNotes || undefined,
      }),
    });
    setStallSubmitting(false);
    if (res.success && res.data) {
      setStallResult(res.data);
    } else {
      setStallError(res.error?.message || 'Stall application submission failed.');
    }
  }

  const loadPercent = Math.min(100, Math.floor((preloadInfo.loaded / preloadInfo.total) * 100));

  return (
    <div className="relative bg-[#FDFBF7] text-[#2D2319] min-h-screen selection:bg-amber-400 selection:text-amber-950 font-sans overflow-x-hidden">
      {/* CUSTOM GOLD CURSOR */}
      <div
        className={`custom-cursor-ring hidden md:block border-amber-600/60 ${isHovered ? 'scale-150 border-amber-500' : ''}`}
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />
      <div
        className="custom-cursor-dot hidden md:block bg-amber-600"
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />

      {/* PEARL WHITE PRELOADER OVERLAY (#loader) */}
      {loading && (
        <div id="loader" className="fixed inset-0 z-50 bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center transition-opacity duration-800">
          <div className="loader-content space-y-4">
            <WhiteTigressMotif size={90} className="mx-auto mb-2 text-amber-700" />
            <div className="text-xs font-mono uppercase tracking-[0.3em] text-amber-800">LOADING EXPERIENCE</div>
            <div className="text-6xl md:text-8xl font-bold font-mono text-[#2D2319] tracking-tighter">
              {loadPercent}%
            </div>
            <div className="text-xs text-amber-700 font-mono tracking-widest uppercase pt-2">
              SAFED SHERI 2026 • 09.10.2026
            </div>
          </div>
        </div>
      )}

      {/* FLOATING PEARL WHITE GLASSMORPHY NAVBAR (LOGO ONLY + ICONS ONLY ON MOBILE + STAFF PORTAL LINK) */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-5xl bg-white/85 backdrop-blur-xl border border-amber-400/40 rounded-full px-4 py-2.5 md:px-6 md:py-3 flex items-center justify-between shadow-[0_8px_30px_rgba(217,119,6,0.12)] transition-all">
        {/* LOGO ONLY (ZERO TEXT BOX) */}
        <LogoSlot />

        {/* ICONS ONLY NAVBAR BUTTONS */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleAudioMute}
            className="p-2.5 rounded-full border border-amber-400/40 text-amber-700 bg-amber-50/80 hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleButtonClick(() => setActiveDrawer('MY_PASS'))}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="p-2.5 md:px-4 md:py-2 rounded-full border border-amber-400/50 text-amber-900 bg-amber-50/90 hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-sm font-semibold text-xs"
            title="MY PASS Wallet"
          >
            <Ticket className="w-4 h-4 text-amber-700" />
            <span className="hidden md:inline tracking-wide">MY PASS</span>
          </button>

          <button
            onClick={() => handleButtonClick(() => setActiveDrawer('GET_PASS'))}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="dandiya-btn p-2.5 md:px-5 md:py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:shadow-md hover:shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            title="GET YOUR PASS"
          >
            <Crown className="w-4 h-4 text-slate-950" />
            <span className="hidden md:inline font-bold">GET YOUR PASS</span>
          </button>

          {/* STAFF TERMINAL LINK */}
          <Link
            href="/login"
            className="p-2.5 rounded-full border border-amber-400/40 text-amber-800 bg-white hover:bg-amber-100 hover:scale-105 transition-all shadow-sm flex items-center justify-center"
            title="Staff Terminal Login"
          >
            <Shield className="w-4 h-4 text-amber-700" />
          </Link>
        </div>
      </header>

      {/* PINNED 330-FRAME CANVAS STORYTELLING SCENE ENGINE (#pinned-scroll-container) */}
      <main className="relative z-10">
        <div id="pinned-scroll-container" className="relative h-[400vh] bg-[#FAF7F2]">
          <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-[#FAF7F2] flex items-center justify-center relative">
            {/* Fullscreen 330-Frame Canvas Engine */}
            <FrameCanvasEngine
              onPreloadProgress={handleFramePreloadProgress}
            />

            {/* Apple-Style Centered Storytelling Overlay Container (Royal Bronze & Warm Gold Typography) */}
            <div className="text-container absolute inset-0 z-10 flex items-center justify-center text-center pointer-events-none p-6">
              {/* Scene 1 */}
              <div id="scene-1" className="scene-text max-w-2xl space-y-4 opacity-0 translate-y-8">
                <WhiteTigressMotif size={80} className="mx-auto text-amber-700" />
                <h1 className="font-cinzel text-5xl md:text-7xl font-bold tracking-tight text-[#1C160F] drop-shadow-md">
                  SAFED SHERI 2026
                </h1>
                <p className="text-lg md:text-xl font-light text-amber-800 tracking-widest uppercase font-mono">
                  The White Garba Experience
                </p>
              </div>

              {/* Scene 2 */}
              <div id="scene-2" className="scene-text max-w-2xl space-y-4 opacity-0 translate-y-8">
                <span className="text-xs uppercase font-mono tracking-widest text-amber-800 px-4 py-1.5 rounded-full border border-amber-400/40 bg-white/90 backdrop-blur-md shadow-sm">
                  SACRED DRESS CODE
                </span>
                <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-[#1C160F] drop-shadow-md">
                  MANDATORY WHITE
                </h2>
                <p className="text-base md:text-lg text-slate-700 max-w-lg mx-auto font-medium">
                  Purity, Grace & Eternal Energy. All attendees must wear traditional White Garba attire.
                </p>
              </div>

              {/* Scene 3 */}
              <div id="scene-3" className="scene-text max-w-2xl space-y-4 opacity-0 translate-y-8">
                <span className="text-xs uppercase font-mono tracking-widest text-amber-800 px-4 py-1.5 rounded-full border border-amber-400/40 bg-white/90 backdrop-blur-md shadow-sm">
                  GARBA MOTION
                </span>
                <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-[#1C160F] drop-shadow-md">
                  RHYTHM OF THE TIGRESS
                </h2>
                <p className="text-base md:text-lg text-slate-700 max-w-lg mx-auto font-medium">
                  Synchronized live orchestra, authentic folk motion, and sacred heritage beats.
                </p>
              </div>

              {/* Scene 4 */}
              <div id="scene-4" className="scene-text max-w-2xl space-y-4 opacity-0 translate-y-8">
                <span className="text-xs uppercase font-mono tracking-widest text-amber-800 px-4 py-1.5 rounded-full border border-amber-400/40 bg-white/90 backdrop-blur-md shadow-sm">
                  ROYAL HOSPITALITY
                </span>
                <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-[#1C160F] drop-shadow-md">
                  GAZEBO LOUNGES
                </h2>
                <p className="text-base md:text-lg text-slate-700 max-w-lg mx-auto font-medium">
                  Elevated spatial viewing, private lounge hospitality, and stage-front pavilions.
                </p>
              </div>

              {/* Scene 5 */}
              <div id="scene-5" className="scene-text max-w-2xl space-y-4 opacity-0 translate-y-8">
                <span className="text-xs uppercase font-mono tracking-widest text-amber-800 px-4 py-1.5 rounded-full border border-amber-400/40 bg-white/90 backdrop-blur-md shadow-sm">
                  STALLS & BRAND PAVILIONS
                </span>
                <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-[#1C160F] drop-shadow-md">
                  CURATED BAZAAR
                </h2>
                <p className="text-base md:text-lg text-slate-700 max-w-lg mx-auto font-medium">
                  Gourmet delicacies, traditional Garba couture, authentic jewellery, and partner stalls.
                </p>
              </div>

              {/* Scene 6 */}
              <div id="scene-6" className="scene-text max-w-2xl space-y-4 opacity-0 translate-y-8">
                <span className="text-xs uppercase font-mono tracking-widest text-amber-800 px-4 py-1.5 rounded-full border border-amber-400/40 bg-white/90 backdrop-blur-md shadow-sm">
                  09.10.2026 • AHMEDABAD
                </span>
                <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-[#1C160F] drop-shadow-md">
                  JOIN THE NIGHT
                </h2>
                <p className="text-base md:text-lg text-slate-700 max-w-lg mx-auto font-medium">
                  Reserve your single or couple pass below to enter the white realm.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* UNPINNED PEARL WHITE INTERACTIVE SECTIONS (PASS CARDS, GAZEBO, SPONSOR, STALL) */}
        <section id="invitation" className="relative z-30 min-h-screen flex flex-col justify-center items-center text-center p-6 bg-[#FDFBF7] border-t border-amber-400/20">
          <div className="max-w-3xl space-y-8 bg-white p-8 md:p-12 rounded-3xl border border-amber-400/30 shadow-xl my-12">
            <WhiteTigressMotif size={100} className="mx-auto text-amber-700" />
            <span className="text-xs uppercase tracking-widest font-mono text-amber-800 px-3.5 py-1 rounded-full border border-amber-400/40 bg-amber-50/80 inline-block">
              Safed Sheri 2026
            </span>
            <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-[#1C160F]">
              THE NIGHT RETURNS
            </h2>
            <p className="text-lg text-slate-600">Reserve Your Pass for 9 October 2026</p>

            {/* SINGLE VS COUPLE PASS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto pt-4">
              <div className="bg-[#FAF7F2] border border-amber-400/30 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500 transition-all shadow-md">
                <div>
                  <span className="text-xs uppercase tracking-widest text-amber-800 font-semibold">{activePhase.phaseName} TIER</span>
                  <h3 className="font-cinzel text-2xl font-bold text-[#1C160F] mt-1">SINGLE PASS</h3>
                  <p className="text-xs text-slate-600 mt-2">1 Individual Attendee • 1 Aadhaar • 1 QR Code</p>
                  <div className="my-4">
                    <span className="text-3xl font-bold text-[#1C160F]">₹{activePhase.singlePrice.toLocaleString()}</span>
                    <span className="text-xs text-slate-500 ml-2">/ pass</span>
                  </div>
                </div>
                <button
                  onClick={() => handleButtonClick(() => { setSelectedPassType('SINGLE'); setActiveDrawer('GET_PASS'); })}
                  className="dandiya-btn w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:from-amber-500 hover:to-yellow-600 transition-all shadow-md"
                >
                  Get Single Pass
                </button>
              </div>

              <div className="bg-[#FAF7F2] border border-amber-400/30 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500 transition-all shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                  Popular
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-amber-800 font-semibold">{activePhase.phaseName} TIER</span>
                  <h3 className="font-cinzel text-2xl font-bold text-[#1C160F] mt-1">COUPLE PASS</h3>
                  <p className="text-xs text-slate-600 mt-2">2 Individual Attendees • 2 Aadhaar Records • 2 Individual QRs</p>
                  <div className="my-4">
                    <span className="text-3xl font-bold text-[#1C160F]">₹{activePhase.couplePrice.toLocaleString()}</span>
                    <span className="text-xs text-slate-500 ml-2">/ couple</span>
                  </div>
                </div>
                <button
                  onClick={() => handleButtonClick(() => { setSelectedPassType('COUPLE'); setActiveDrawer('GET_PASS'); })}
                  className="dandiya-btn w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:from-amber-500 hover:to-yellow-600 transition-all shadow-md"
                >
                  Get Couple Pass
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <button
                onClick={() => handleButtonClick(() => setActiveDrawer('GAZEBO'))}
                className="px-6 py-2.5 bg-amber-50/80 border border-amber-300 text-xs font-semibold text-amber-900 rounded-full hover:border-amber-500 transition-all flex items-center gap-2 backdrop-blur-md shadow-sm"
              >
                <Crown className="w-4 h-4 text-amber-700" />
                <span>Enquire for Gazebo</span>
              </button>

              <button
                onClick={() => handleButtonClick(() => setActiveDrawer('SPONSOR'))}
                className="px-6 py-2.5 bg-amber-50/80 border border-amber-300 text-xs font-semibold text-amber-900 rounded-full hover:border-amber-500 transition-all flex items-center gap-2 backdrop-blur-md shadow-sm"
              >
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>Become a Sponsor</span>
              </button>

              <button
                onClick={() => handleButtonClick(() => setActiveDrawer('STALL'))}
                className="px-6 py-2.5 bg-amber-50/80 border border-amber-300 text-xs font-semibold text-amber-900 rounded-full hover:border-amber-500 transition-all flex items-center gap-2 backdrop-blur-md shadow-sm"
              >
                <Store className="w-4 h-4 text-amber-700" />
                <span>Apply for Stall</span>
              </button>
            </div>

            {/* OPERATIONAL TERMINALS FOOTER QUICK LINKS */}
            <div className="pt-8 border-t border-amber-200/80">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold block mb-3">
                OPERATIONAL STAFF TERMINAL ACCESS
              </span>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 bg-white border border-amber-300 text-xs font-bold text-amber-900 rounded-lg hover:bg-amber-100 transition-all shadow-xs"
                >
                  Staff Login Portal (/login)
                </Link>
                <Link
                  href="/admin"
                  className="px-3.5 py-1.5 bg-white border border-amber-300 text-xs font-bold text-amber-900 rounded-lg hover:bg-amber-100 transition-all shadow-xs"
                >
                  Super Admin Center (/admin)
                </Link>
                <Link
                  href="/cashier"
                  className="px-3.5 py-1.5 bg-white border border-amber-300 text-xs font-bold text-amber-900 rounded-lg hover:bg-amber-100 transition-all shadow-xs"
                >
                  Cashier Terminal (/cashier)
                </Link>
                <Link
                  href="/security"
                  className="px-3.5 py-1.5 bg-white border border-amber-300 text-xs font-bold text-amber-900 rounded-lg hover:bg-amber-100 transition-all shadow-xs"
                >
                  Gate Security Scanner (/security)
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* UTILITY DRAWER OVERLAYS (FULL BACKEND FUNCTIONALITY PRESERVED) */}
      
      {/* DRAWER A: GET YOUR PASS (REGISTRATION) */}
      {activeDrawer === 'GET_PASS' && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveDrawer('NONE')}></div>
          <div className="relative z-10 w-full max-w-lg bg-[#FAF7F2] border-l border-amber-400/30 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl text-[#2D2319]">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-300/40">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#1C160F]">RESERVE YOUR PLACE</h3>
                  <span className="text-xs text-amber-800 font-mono">
                    {activePhase.phaseName} • {selectedPassType === 'SINGLE' ? `₹${activePhase.singlePrice.toLocaleString()}` : `₹${activePhase.couplePrice.toLocaleString()}`}
                  </span>
                </div>
                <button onClick={() => setActiveDrawer('NONE')} className="p-1 text-slate-500 hover:text-[#1C160F]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {otpError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {passStep === 1 && (
                <div className="space-y-6">
                  <span className="text-xs uppercase tracking-widest font-mono text-amber-800">Step 01 — Choose Your Night</span>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedPassType('SINGLE')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedPassType === 'SINGLE'
                          ? 'border-amber-500 bg-amber-100/70 text-[#1C160F] shadow-md'
                          : 'border-amber-200 bg-white text-slate-600 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-xs uppercase font-bold text-amber-800 block">SINGLE</span>
                      <span className="text-xl font-bold text-[#1C160F] block my-1">₹{activePhase.singlePrice.toLocaleString()}</span>
                      <span className="text-[11px] text-slate-500 block">1 Attendee • 1 Aadhaar • 1 QR</span>
                    </button>

                    <button
                      onClick={() => setSelectedPassType('COUPLE')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedPassType === 'COUPLE'
                          ? 'border-amber-500 bg-amber-100/70 text-[#1C160F] shadow-md'
                          : 'border-amber-200 bg-white text-slate-600 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-xs uppercase font-bold text-amber-800 block">COUPLE</span>
                      <span className="text-xl font-bold text-[#1C160F] block my-1">₹{activePhase.couplePrice.toLocaleString()}</span>
                      <span className="text-[11px] text-slate-500 block">2 Attendees • 2 Aadhaar • 2 QRs</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setPassStep(2)}
                    className="w-full py-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>Proceed to Attendee Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {passStep === 2 && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-widest font-mono text-amber-800">
                      Step 02 — Attendee Identity ({selectedPassType})
                    </span>
                    <button onClick={() => setPassStep(1)} className="text-xs text-amber-700 hover:underline">Change Pass Type</button>
                  </div>

                  <div className="p-4 bg-white border border-amber-200 rounded-xl space-y-3 shadow-xs">
                    <span className="text-xs font-semibold text-[#1C160F] block">Primary Attendee Details</span>
                    <input
                      type="text"
                      required
                      value={att1Name}
                      onChange={(e) => setAtt1Name(e.target.value)}
                      placeholder="Full Name (Primary Attendee)"
                      className="w-full bg-[#FAF7F2] border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#1C160F] focus:border-amber-500"
                    />
                    <input
                      type="text"
                      required
                      value={att1Phone}
                      onChange={(e) => setAtt1Phone(e.target.value)}
                      placeholder="WhatsApp Phone (+91 98765 43210)"
                      className="w-full bg-[#FAF7F2] border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#1C160F] focus:border-amber-500"
                    />
                    <input
                      type="email"
                      value={att1Email}
                      onChange={(e) => setAtt1Email(e.target.value)}
                      placeholder="Email Address (Optional)"
                      className="w-full bg-[#FAF7F2] border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#1C160F] focus:border-amber-500"
                    />
                    <input
                      type="text"
                      required
                      value={att1Aadhaar}
                      onChange={(e) => setAtt1Aadhaar(e.target.value)}
                      placeholder="12-Digit Aadhaar Number (Mandatory)"
                      className="w-full bg-[#FAF7F2] border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#1C160F] focus:border-amber-500 font-mono"
                    />
                  </div>

                  {selectedPassType === 'COUPLE' && (
                    <div className="p-4 bg-white border border-amber-200 rounded-xl space-y-3 shadow-xs">
                      <span className="text-xs font-semibold text-[#1C160F] block">Companion Attendee Details</span>
                      <input
                        type="text"
                        required
                        value={att2Name}
                        onChange={(e) => setAtt2Name(e.target.value)}
                        placeholder="Companion Full Name"
                        className="w-full bg-[#FAF7F2] border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#1C160F] focus:border-amber-500"
                      />
                      <input
                        type="text"
                        value={att2Phone}
                        onChange={(e) => setAtt2Phone(e.target.value)}
                        placeholder="Companion Phone (Optional)"
                        className="w-full bg-[#FAF7F2] border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#1C160F] focus:border-amber-500"
                      />
                      <input
                        type="text"
                        required
                        value={att2Aadhaar}
                        onChange={(e) => setAtt2Aadhaar(e.target.value)}
                        placeholder="Companion 12-Digit Aadhaar (Mandatory)"
                        className="w-full bg-[#FAF7F2] border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#1C160F] focus:border-amber-500 font-mono"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!att1Name || !att1Phone || !att1Aadhaar || (selectedPassType === 'COUPLE' && (!att2Name || !att2Aadhaar))) {
                        setOtpError('Please fill out all mandatory attendee fields and 12-digit Aadhaar numbers');
                        return;
                      }
                      setPassStep(3);
                      handleSendWhatsAppOtp();
                    }}
                    className="w-full py-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>Proceed to WhatsApp Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {passStep === 3 && (
                <div className="space-y-5">
                  <span className="text-xs uppercase tracking-widest font-mono text-amber-800">Step 03 — Verify WhatsApp</span>
                  <div className="p-4 bg-white border border-amber-300 rounded-xl space-y-3 text-center shadow-xs">
                    <Phone className="w-8 h-8 text-amber-700 mx-auto mb-1" />
                    <h4 className="text-sm font-bold text-[#1C160F]">Verification Code Sent</h4>
                    <p className="text-xs text-slate-600">We sent a 6-digit verification code to your WhatsApp number <strong className="text-[#1C160F]">{att1Phone}</strong>.</p>

                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP (e.g. 123456)"
                      className="w-full bg-[#FAF7F2] border border-amber-300 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-[#1C160F] focus:border-amber-500"
                    />

                    <button
                      onClick={handleVerifyWhatsAppOtp}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 disabled:opacity-50 shadow-md"
                    >
                      {isSubmitting ? 'Verifying & Creating Booking...' : 'Verify OTP & Complete Booking'}
                    </button>
                  </div>
                </div>
              )}

              {passStep === 4 && bookingResult && (
                <div className="space-y-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center mx-auto text-amber-700">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-800 block">BOOKING CREATED SUCCESSFULLY</span>
                    <h3 className="font-cinzel text-2xl font-bold text-[#1C160F] mt-1">{bookingResult.registrationNumber}</h3>
                    <div className="mt-2 inline-block px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-xs font-bold text-amber-900">
                      STATUS: PAYMENT_PENDING
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-amber-200 rounded-xl text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pass Category:</span>
                      <span className="font-bold text-[#1C160F]">{bookingResult.passType} ({bookingResult.attendeesCount} Attendee{bookingResult.attendeesCount > 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Due:</span>
                      <span className="font-bold text-amber-800">₹{bookingResult.amountDue?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-2 text-xs text-amber-900">
                    <strong className="block font-bold text-amber-800">⚠️ NO ACTIVE PASS HAS BEEN ISSUED YET</strong>
                    <p className="leading-relaxed">
                      {bookingResult.cashCounterInstructions}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-amber-200 text-[11px] text-slate-500">
              <span>• Mandatory White Dress Code applies to all attendees & children.</span>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER B: MY PASS WALLET */}
      {activeDrawer === 'MY_PASS' && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveDrawer('NONE')}></div>
          <div className="relative z-10 w-full max-w-md bg-[#FAF7F2] border-l border-amber-400/30 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl text-[#2D2319]">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-300/40">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-amber-700" />
                  <h3 className="font-cinzel text-lg font-bold text-[#1C160F]">MY PASS WALLET</h3>
                </div>
                <button onClick={() => setActiveDrawer('NONE')} className="p-1 text-slate-500 hover:text-[#1C160F]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {myPassError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{myPassError}</span>
                </div>
              )}

              {!myPassData && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Authenticate via your registered WhatsApp phone number to access your digital pass wallet and entry QR code.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">WhatsApp Phone Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={myPassPhone}
                        onChange={(e) => setMyPassPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="flex-1 bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleSendMyPassOtp}
                        className="px-4 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 shrink-0 shadow-xs"
                      >
                        Send OTP
                      </button>
                    </div>
                  </div>

                  {myPassOtpSent && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <span className="text-xs font-semibold text-amber-900 block">OTP Sent to {myPassPhone}</span>
                      <input
                        type="text"
                        value={myPassOtp}
                        onChange={(e) => setMyPassOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP (e.g. 123456)"
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm text-[#1C160F] font-mono text-center tracking-widest"
                      />
                      <button
                        onClick={handleVerifyMyPassOtp}
                        disabled={myPassLoading}
                        className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 disabled:opacity-50 shadow-xs"
                      >
                        {myPassLoading ? 'Retrieving Pass Wallet...' : 'Verify OTP & Open Wallet'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {myPassData && (
                <div className="space-y-6">
                  {myPassData.length === 0 ? (
                    <div className="p-4 bg-white border border-amber-200 rounded-xl text-center space-y-2">
                      <span className="text-xs text-slate-600 block">No booking records found for WhatsApp number {myPassPhone}.</span>
                    </div>
                  ) : (
                    myPassData.map((passItem: any, idx: number) => (
                      <div key={idx} className="space-y-4">
                        {!passItem.hasActivePass ? (
                          <div className="bg-white border border-amber-300 rounded-2xl p-5 space-y-3 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-mono uppercase text-amber-800 block">BOOKING CREATED</span>
                                <h4 className="font-cinzel text-lg font-bold text-[#1C160F]">{passItem.registrationNumber}</h4>
                              </div>
                              <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 rounded-full text-[10px] font-bold text-amber-900">
                                PAYMENT_PENDING
                              </span>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                              <strong className="block text-amber-800 font-bold">⚠️ NO USABLE PASS ISSUED YET</strong>
                              <p>{passItem.cashCounterInstructions}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-amber-400 rounded-2xl p-6 space-y-5 text-center shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600"></div>
                            
                            <div>
                              <span className="font-cinzel font-bold text-lg text-[#1C160F] block tracking-widest">SAFED SHERI 2026</span>
                              <span className="text-[10px] text-amber-800 font-mono tracking-widest">OFFICIAL ENTRY PASS</span>
                            </div>

                            <div className="w-48 h-48 bg-[#FAF7F2] p-3 rounded-2xl mx-auto shadow-inner border border-amber-200 flex flex-col justify-center items-center relative">
                              <QrCode className="w-36 h-36 text-slate-900" />
                              <span className="text-[9px] font-mono text-slate-600 mt-1 truncate max-w-full">
                                {passItem.credential.secureToken}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs">
                              <span className="font-bold text-[#1C160F] text-base block">{passItem.attendeeName}</span>
                              <span className="text-amber-800 font-mono font-semibold block">{passItem.credential.credentialNumber}</span>
                              <span className="text-slate-500 block">Booking Ref: {passItem.registrationNumber}</span>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 text-left space-y-1">
                              <p className="font-bold text-amber-800">• WHITE DRESS CODE MANDATORY</p>
                              <p>• Strictly non-transferable. Valid only for {passItem.attendeeName}.</p>
                              <p>• Entry permitted only from original digital pass wallet source.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-amber-200 text-[11px] text-slate-500 space-y-1">
              <p>• Entry permitted only via original digital pass source.</p>
              <p>• White dress code compulsory for all attendees.</p>
              <p>• Passes are strictly non-transferable.</p>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER C: GAZEBO SPATIAL MAP */}
      {activeDrawer === 'GAZEBO' && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveDrawer('NONE')}></div>
          <div className="relative z-10 w-full max-w-lg bg-[#FAF7F2] border-l border-amber-400/30 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl text-[#2D2319]">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-300/40">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#1C160F]">GAZEBO HOSPITALITY</h3>
                  <span className="text-xs text-amber-800 font-mono">ENQUIRE ONLY • NO DIRECT PURCHASE</span>
                </div>
                <button onClick={() => setActiveDrawer('NONE')} className="p-1 text-slate-500 hover:text-[#1C160F]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {gazeboError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{gazeboError}</span>
                </div>
              )}

              {gazeboInquiryResult ? (
                <div className="space-y-5 text-center my-auto">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center mx-auto text-amber-700">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-800 block">YOUR ENQUIRY HAS BEEN RECEIVED</span>
                    <h3 className="font-cinzel text-2xl font-bold text-[#1C160F] mt-1">Ref: {gazeboInquiryResult.inquiryNumber}</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                    Our team will contact you personally to discuss availability and arrangements.
                  </p>

                  <div className="p-4 bg-white border border-amber-200 rounded-xl text-[11px] text-amber-900 text-left space-y-1">
                    <p className="font-bold text-amber-800">• ENQUIRY CONFIRMATION NOTICE</p>
                    <p>• 0 Gazebo inventory deducted</p>
                    <p>• 0 Payments or booking fees created</p>
                    <p>• 0 Passes or tickets issued</p>
                  </div>

                  <button
                    onClick={() => { setGazeboInquiryResult(null); setSelectedGazeboLevel(null); }}
                    className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-xs font-semibold text-[#1C160F] rounded-xl border border-amber-300"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : selectedGazeboLevel === null ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Private space. Elevated hospitality. One unforgettable night. Explore our 3 spatial levels and enquire below.
                  </p>

                  <div className="p-5 bg-white border border-amber-300 rounded-2xl space-y-3 hover:border-amber-500 transition-all shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800 block">TOP TIER HOSPITALITY</span>
                        <h4 className="font-cinzel text-lg font-bold text-[#1C160F]">LEVEL 3 — VIP MASTER SUITE</h4>
                      </div>
                      <span className="text-amber-800 font-bold text-base">₹{gazeboAvailability.level3.price.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-100">
                      <span className="text-slate-500 font-mono">
                        {gazeboAvailability.level3.available} of {gazeboAvailability.level3.total} gazebos available
                      </span>
                      <button
                        onClick={() => setSelectedGazeboLevel(3)}
                        className="dandiya-btn px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs"
                      >
                        ENQUIRE FOR A GAZEBO
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-amber-300 rounded-2xl space-y-3 hover:border-amber-500 transition-all shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800 block">ELEVATED VIEWING</span>
                        <h4 className="font-cinzel text-lg font-bold text-[#1C160F]">LEVEL 2 — ELEVATED LOUNGE</h4>
                      </div>
                      <span className="text-amber-800 font-bold text-base">₹{gazeboAvailability.level2.price.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-100">
                      <span className="text-slate-500 font-mono">
                        {gazeboAvailability.level2.available} of {gazeboAvailability.level2.total} gazebos available
                      </span>
                      <button
                        onClick={() => setSelectedGazeboLevel(2)}
                        className="dandiya-btn px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs"
                      >
                        ENQUIRE FOR A GAZEBO
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-amber-300 rounded-2xl space-y-3 hover:border-amber-500 transition-all shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-800 block">STAGE FRONT</span>
                        <h4 className="font-cinzel text-lg font-bold text-[#1C160F]">LEVEL 1 — PRIME STAGE FRONT</h4>
                      </div>
                      <span className="text-amber-800 font-bold text-base">₹{gazeboAvailability.level1.price.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-100">
                      <span className="text-slate-500 font-mono">
                        {gazeboAvailability.level1.available} of {gazeboAvailability.level1.total} gazebos available
                      </span>
                      <button
                        onClick={() => setSelectedGazeboLevel(1)}
                        className="dandiya-btn px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs"
                      >
                        ENQUIRE FOR A GAZEBO
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-widest font-mono text-amber-800">
                      Enquire for Level {selectedGazeboLevel}
                    </span>
                    <button onClick={() => setSelectedGazeboLevel(null)} className="text-xs text-amber-700 hover:underline">Back to Spatial Map</button>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <strong>This is an enquiry, not a booking.</strong> Our team will contact you personally to discuss availability and arrangements.
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={gazeboName}
                        onChange={(e) => setGazeboName(e.target.value)}
                        placeholder="Your Full Name"
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">WhatsApp Phone Number</label>
                      <input
                        type="text"
                        required
                        value={gazeboPhone}
                        onChange={(e) => setGazeboPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Special Requirements / Notes (Optional)</label>
                      <textarea
                        value={gazeboNotes}
                        onChange={(e) => setGazeboNotes(e.target.value)}
                        placeholder="Group size, preferred positioning, or hospitality requests..."
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] h-24 focus:outline-none focus:border-amber-500"
                      ></textarea>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubmitGazeboInquiry(selectedGazeboLevel)}
                    disabled={gazeboSubmitting}
                    className="dandiya-btn w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50"
                  >
                    {gazeboSubmitting ? 'Submitting Enquiry...' : 'ENQUIRE FOR A GAZEBO'}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-amber-200 space-y-1 text-[11px] text-slate-500">
              <p>• Submitting an enquiry does not consume inventory or reserve a gazebo.</p>
              <p>• All gazebo bookings are handled personally by Safed Sheri executive staff.</p>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER D: REAL SPONSOR INQUIRY */}
      {activeDrawer === 'SPONSOR' && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveDrawer('NONE')}></div>
          <div className="relative z-10 w-full max-w-md bg-[#FAF7F2] border-l border-amber-400/30 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl text-[#2D2319]">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-300/40">
                <h3 className="font-cinzel text-lg font-bold text-[#1C160F]">BECOME A SPONSOR</h3>
                <button onClick={() => setActiveDrawer('NONE')} className="p-1 text-slate-500 hover:text-[#1C160F]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {sponsorError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{sponsorError}</span>
                </div>
              )}

              {sponsorResult ? (
                <div className="space-y-5 text-center my-auto">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center mx-auto text-amber-700">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-800 block">APPLICATION RECEIVED</span>
                    <h3 className="font-cinzel text-2xl font-bold text-[#1C160F] mt-1">Ref: {sponsorResult.inquiryNumber}</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                    {sponsorResult.message}
                  </p>

                  <button
                    onClick={() => { setSponsorResult(null); setSponsorCompany(''); setSponsorContact(''); setSponsorPhone(''); }}
                    className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-xs font-semibold text-[#1C160F] rounded-xl border border-amber-300"
                  >
                    Submit Another Application
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Partner with Safed Sheri 2026 for brand visibility across our premium audience.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Company / Brand Name</label>
                    <input
                      type="text"
                      required
                      value={sponsorCompany}
                      onChange={(e) => setSponsorCompany(e.target.value)}
                      placeholder="Company Name"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      required
                      value={sponsorContact}
                      onChange={(e) => setSponsorContact(e.target.value)}
                      placeholder="Contact Name"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">WhatsApp Phone Number</label>
                    <input
                      type="text"
                      required
                      value={sponsorPhone}
                      onChange={(e) => setSponsorPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={sponsorEmail}
                      onChange={(e) => setSponsorEmail(e.target.value)}
                      placeholder="brand@company.com"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Sponsorship Goals / Details</label>
                    <textarea
                      value={sponsorNotes}
                      onChange={(e) => setSponsorNotes(e.target.value)}
                      placeholder="Specify partnership objectives, budget tier, or branding requirements..."
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] h-24 focus:outline-none focus:border-amber-500"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {!sponsorResult && (
              <div className="pt-6 border-t border-amber-200">
                <button
                  onClick={handleSubmitSponsorInquiry}
                  disabled={sponsorSubmitting}
                  className="dandiya-btn w-full py-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 shadow-md"
                >
                  {sponsorSubmitting ? 'Submitting Application...' : 'SUBMIT SPONSOR APPLICATION'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAWER E: REAL STALL APPLICATION */}
      {activeDrawer === 'STALL' && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActiveDrawer('NONE')}></div>
          <div className="relative z-10 w-full max-w-md bg-[#FAF7F2] border-l border-amber-400/30 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl text-[#2D2319]">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-300/40">
                <h3 className="font-cinzel text-lg font-bold text-[#1C160F]">APPLY FOR A STALL</h3>
                <button onClick={() => setActiveDrawer('NONE')} className="p-1 text-slate-500 hover:text-[#1C160F]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {stallError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{stallError}</span>
                </div>
              )}

              {stallResult ? (
                <div className="space-y-5 text-center my-auto">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center mx-auto text-amber-700">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-amber-800 block">APPLICATION RECEIVED</span>
                    <h3 className="font-cinzel text-2xl font-bold text-[#1C160F] mt-1">Ref: {stallResult.inquiryNumber}</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                    {stallResult.message}
                  </p>

                  <button
                    onClick={() => { setStallResult(null); setStallBrand(''); setStallContact(''); setStallPhone(''); }}
                    className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-xs font-semibold text-[#1C160F] rounded-xl border border-amber-300"
                  >
                    Submit Another Application
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Showcase your brand at Safed Sheri 2026 (Food, Beverage, Traditional Wear, Jewellery, Accessories).
                  </p>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Brand / Stall Name</label>
                    <input
                      type="text"
                      required
                      value={stallBrand}
                      onChange={(e) => setStallBrand(e.target.value)}
                      placeholder="Brand Name"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      required
                      value={stallContact}
                      onChange={(e) => setStallContact(e.target.value)}
                      placeholder="Contact Name"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Stall Category</label>
                    <select
                      value={stallCategory}
                      onChange={(e) => setStallCategory(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                    >
                      <option value="FOOD_BEVERAGE">Food & Gourmet Beverages</option>
                      <option value="CLOTHING_GARBA">Traditional Garba Clothing & Chaniya Choli</option>
                      <option value="JEWELLERY">Traditional Jewellery & Accessories</option>
                      <option value="ART_CRAFT">Handicrafts & Art</option>
                      <option value="OTHER">Other Merchandise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">WhatsApp Phone Number</label>
                    <input
                      type="text"
                      required
                      value={stallPhone}
                      onChange={(e) => setStallPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Special Requirements / Setup Notes (Optional)</label>
                    <textarea
                      value={stallNotes}
                      onChange={(e) => setStallNotes(e.target.value)}
                      placeholder="Power requirements, space dimension preferences, equipment setup..."
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-[#1C160F] h-24 focus:outline-none focus:border-amber-500"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {!stallResult && (
              <div className="pt-6 border-t border-amber-200">
                <button
                  onClick={handleSubmitStallInquiry}
                  disabled={stallSubmitting}
                  className="dandiya-btn w-full py-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 shadow-md"
                >
                  {stallSubmitting ? 'Submitting Application...' : 'SUBMIT STALL APPLICATION'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
