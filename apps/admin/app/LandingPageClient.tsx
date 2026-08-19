'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { IllusionEngine } from './components/IllusionEngine';
import LogoSlot from './components/LogoSlot';
import { garbaAudio } from './components/GarbaAudioEngine';
import { Sponsor3DGallery } from './components/Sponsor3DGallery';
import { Volume2, VolumeX, Sparkles, Music, Crown, Shield, ArrowRight, AlertCircle, ChevronRight, ChevronLeft, Plus, Minus, Users, Check, RotateCcw, Timer, Clock, Flame, EyeOff, Store, Send, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/safedsheri/api/v1';

// Auto-formats 12-digit Aadhaar to 4-4-4: "1234 5678 9012"
function formatAadhaarNumber(val: string): string {
  const digits = (val || '').replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

// Auto-formats 10-digit Phone to 5-5: "98765 43210"
function formatPhoneNumber(val: string): string {
  const digits = (val || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return digits;
}

// Auto-formats Search Input (Aadhaar or Phone)
function formatSearchInput(val: string): string {
  const digits = (val || '').replace(/\D/g, '').slice(0, 12);
  if (digits.length > 10) {
    return formatAadhaarNumber(digits);
  } else if (digits.length > 5) {
    return formatPhoneNumber(digits);
  }
  return digits;
}

export default function SafedSheriLandingPage() {
  // Audio state
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // Active Navbar Section Spy
  const [activeSection, setActiveSection] = useState('call');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['call', 'colour', 'gazebos', 'sponsors', 'passes'];
      let current = '';

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the top of the section is above the middle of the screen
          // and the bottom is below the top of the screen
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= 100) {
            current = section;
            break;
          }
        }
      }

      if (current) {
        setActiveSection(current);
      } else if (window.scrollY < 100) {
        setActiveSection('call');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Booking Drawer State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<'SINGLE' | 'COUPLE' | 'GAZEBO'>('SINGLE');
  const [pricing, setPricing] = useState<any>({
    singlePrice: 3500,
    couplePrice: 6500,
    nextSinglePrice: 6500,
    nextCouplePrice: 12000,
    showSinglePrice: true,
    showCouplePrice: true,
    showGazeboPrice: false,
    isCountdownActive: true,
    countdownTarget: null,
    urgencyTagline: '⚡ Early Bird Phase Ending Soon — Lock in passes at ₹3,500 before price escalates to ₹6,500!',
    hiddenPriceLabel: 'Price Revealed on Approval',
    phaseName: 'EARLY_BIRD',
  });

  // Urgency Reverse Stop Watch State
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 3, hours: 14, minutes: 22, seconds: 45, expired: false });

  // Live Pricing & Urgency Phase Sync
  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch(`${API_BASE}/registrations/active-phase`);
        const json = await res.json();
        if (json.success && json.data) {
          setPricing(json.data);
        }
      } catch (err) {
        console.warn('Failed to load active pricing phase', err);
      }
    }
    fetchPricing();
    const interval = setInterval(fetchPricing, 8000);
    return () => clearInterval(interval);
  }, []);

  // Urgency Countdown Ticker
  useEffect(() => {
    if (!pricing?.isCountdownActive || !pricing?.countdownTarget) return;

    const tick = () => {
      const target = new Date(pricing.countdownTarget).getTime();
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, expired: false });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pricing?.isCountdownActive, pricing?.countdownTarget]);

  // Attendees Input State
  const [attendees, setAttendees] = useState<Array<{
    fullName: string;
    phone: string;
    email: string;
    gender: 'FEMALE' | 'MALE';
    aadhaarNumber: string;
    documentKey: string;
    documentName: string;
    uploading?: boolean;
  }>>([
    { fullName: '', phone: '', email: '', gender: 'FEMALE', aadhaarNumber: '', documentKey: '', documentName: '' }
  ]);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submittedApplication, setSubmittedApplication] = useState<any | null>(null);
  const [samePhoneForAll, setSamePhoneForAll] = useState(true);

  // Carousel Wizard State
  const [wizardStep, setWizardStep] = useState<'QUANTITY' | 'ATTENDEE' | 'SUMMARY'>('QUANTITY');
  const [currentAttendeeIndex, setCurrentAttendeeIndex] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [showDressCode, setShowDressCode] = useState(true);

  // Auto-Save Draft to LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('safedsheri_booking_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.attendees && parsed.attendees.length > 0) {
          setAttendees(parsed.attendees);
          if (parsed.selectedPass) setSelectedPass(parsed.selectedPass);
          if (parsed.samePhoneForAll !== undefined) setSamePhoneForAll(parsed.samePhoneForAll);
        }
      }
    } catch (e) {
      console.warn('Draft recovery skipped', e);
    }
  }, []);

  // Save draft whenever attendees change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (attendees.length > 0) {
        localStorage.setItem(
          'safedsheri_booking_draft',
          JSON.stringify({
            selectedPass,
            attendees,
            samePhoneForAll,
          })
        );
      }
    } catch (e) {
      // ignore
    }
  }, [attendees, selectedPass, samePhoneForAll]);

  // My Pass Wallet State
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletPhone, setWalletPhone] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletPasses, setWalletPasses] = useState<any[]>([]);
  const [walletSearched, setWalletSearched] = useState(false);

  // Active Payment Modal State
  const [activePaymentLink, setActivePaymentLink] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);

  // VIP Gazebo Modal State
  const [isGazeboModalOpen, setIsGazeboModalOpen] = useState(false);
  const [gazeboForm, setGazeboForm] = useState({ fullName: '', phone: '', level: 1, notes: '' });
  const [gazeboSuccess, setGazeboSuccess] = useState(false);
  const [gazeboLoading, setGazeboLoading] = useState(false);

  // Sponsor Partnership Inquiry Modal State
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [sponsorSuccess, setSponsorSuccess] = useState(false);
  const [sponsorLoading, setSponsorLoading] = useState(false);
  const [sponsorReference, setSponsorReference] = useState('');
  const [sponsorForm, setSponsorForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    sponsorshipType: 'Title Presenting Partner (Grand Arena Branding)',
    notes: '',
  });

  // Gazebo Error State
  const [gazeboError, setGazeboError] = useState<string | null>(null);

  // Review Invariant Modal
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${API_BASE}/registrations/active-phase`);
      const json = await res.json();
      if (json.success && json.data) {
        setPricing(json.data);
      }
    } catch (e) {
      console.log('Using default pricing phase');
    }
  };

  const handleToggleSound = () => {
    const muted = garbaAudio.toggleMute();
    setIsSoundMuted(muted);
    if (!muted) {
      garbaAudio.playDandiya();
    }
  };

  const handlePassQuantityChange = (count: number) => {
    const currentCount = attendees.length;
    if (count === currentCount || count < 1 || count > 7) return;
    garbaAudio.playDandiya();
    const primaryPhone = attendees[0]?.phone || '';
    if (count > currentCount) {
      const newAttendees = [...attendees];
      for (let i = currentCount; i < count; i++) {
        newAttendees.push({
          fullName: '',
          phone: samePhoneForAll ? primaryPhone : '',
          email: '',
          gender: 'FEMALE',
          aadhaarNumber: '',
          documentKey: '',
          documentName: '',
        });
      }
      setAttendees(newAttendees);
    } else {
      setAttendees(attendees.slice(0, count));
      if (currentAttendeeIndex >= count) {
        setCurrentAttendeeIndex(count - 1);
      }
    }
  };

  const handlePassQuantityIncrement = () => {
    if (attendees.length >= 7) return;
    handlePassQuantityChange(attendees.length + 1);
  };

  const handlePassQuantityDecrement = () => {
    if (attendees.length <= 1) return;
    handlePassQuantityChange(attendees.length - 1);
  };

  const handleResetDraft = () => {
    garbaAudio.playDandiya();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('safedsheri_booking_draft');
    }
    setAttendees([
      { fullName: '', phone: '', email: '', gender: 'FEMALE', aadhaarNumber: '', documentKey: '', documentName: '' }
    ]);
    setCurrentAttendeeIndex(0);
    setWizardStep(selectedPass === 'SINGLE' ? 'QUANTITY' : 'ATTENDEE');
    setBookingError(null);
  };

  const validateCurrentAttendee = (idx: number): boolean => {
    const att = attendees[idx];
    if (!att.fullName || att.fullName.trim().length < 2) {
      setBookingError(`Please enter full legal name for Attendee #${idx + 1}`);
      return false;
    }
    if (!att.phone || att.phone.replace(/\D/g, '').length < 10) {
      setBookingError(`Please enter a valid 10-digit WhatsApp phone for Attendee #${idx + 1}`);
      return false;
    }
    const cleanAadhaar = (att.aadhaarNumber || '').replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      setBookingError(`Please enter a valid 12-digit Aadhaar number for Attendee #${idx + 1}`);
      return false;
    }

    // Check duplicate Aadhaar in current batch
    for (let i = 0; i < attendees.length; i++) {
      if (i !== idx) {
        const otherAadhaar = (attendees[i].aadhaarNumber || '').replace(/\D/g, '');
        if (otherAadhaar && otherAadhaar === cleanAadhaar) {
          setBookingError(`Attendee #${idx + 1} has duplicate Aadhaar with Attendee #${i + 1}. Each guest requires a unique Aadhaar card.`);
          return false;
        }
      }
    }

    if (!att.documentKey) {
      setBookingError(`Please upload Aadhaar document for Attendee #${idx + 1} (${att.fullName})`);
      return false;
    }

    setBookingError(null);
    return true;
  };

  const handleNextStep = () => {
    if (wizardStep === 'QUANTITY') {
      garbaAudio.playDandiya();
      setWizardStep('ATTENDEE');
      setCurrentAttendeeIndex(0);
      return;
    }

    if (wizardStep === 'ATTENDEE') {
      if (!validateCurrentAttendee(currentAttendeeIndex)) {
        garbaAudio.playDandiya();
        return;
      }
      garbaAudio.playDandiya();
      if (currentAttendeeIndex < attendees.length - 1) {
        setCurrentAttendeeIndex(currentAttendeeIndex + 1);
      } else {
        setWizardStep('SUMMARY');
      }
    }
  };

  const handlePrevStep = () => {
    garbaAudio.playDandiya();
    setBookingError(null);
    if (wizardStep === 'SUMMARY') {
      setWizardStep('ATTENDEE');
      setCurrentAttendeeIndex(attendees.length - 1);
      return;
    }

    if (wizardStep === 'ATTENDEE') {
      if (currentAttendeeIndex > 0) {
        setCurrentAttendeeIndex(currentAttendeeIndex - 1);
      } else {
        if (selectedPass === 'SINGLE') {
          setWizardStep('QUANTITY');
        }
      }
    }
  };

  const handlePassSelect = (type: 'SINGLE' | 'COUPLE' | 'GAZEBO') => {
    garbaAudio.playGhunghroo();
    setSelectedPass(type);
    setCurrentAttendeeIndex(0);
    if (type === 'SINGLE') {
      setWizardStep('QUANTITY');
      if (attendees.length === 0) {
        setAttendees([
          { fullName: '', phone: '', email: '', gender: 'FEMALE', aadhaarNumber: '', documentKey: '', documentName: '' }
        ]);
      }
    } else if (type === 'COUPLE') {
      setWizardStep('ATTENDEE');
      setAttendees([
        { fullName: '', phone: '', email: '', gender: 'FEMALE', aadhaarNumber: '', documentKey: '', documentName: '' },
        { fullName: '', phone: '', email: '', gender: 'MALE', aadhaarNumber: '', documentKey: '', documentName: '' }
      ]);
    } else if (type === 'GAZEBO') {
      setIsBookingOpen(false);
      setIsGazeboModalOpen(true);
      return;
    }
    setIsBookingOpen(true);
    setBookingError(null);
    setSubmittedApplication(null);
    setTermsAccepted(false);
    setShowTerms(false);
    setTermsError(false);
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setBookingError('Aadhaar document exceeds 5MB limit.');
      return;
    }

    setAttendees((prev) => {
      const copy = [...prev];
      if (copy[index]) copy[index] = { ...copy[index], uploading: true };
      return copy;
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/uploads/aadhaar`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success && json.data) {
        setAttendees((prev) => {
          const copy = [...prev];
          if (copy[index]) {
            copy[index] = {
              ...copy[index],
              documentKey: json.data.storageKey,
              documentName: json.data.originalFilename,
              uploading: false,
            };
          }
          return copy;
        });
        setBookingError(null);
        garbaAudio.playDandiya();
      } else {
        throw new Error(json.message || 'Upload failed');
      }
    } catch (err: any) {
      setAttendees((prev) => {
        const copy = [...prev];
        if (copy[index]) copy[index] = { ...copy[index], uploading: false };
        return copy;
      });
      setBookingError(`File upload error: ${err.message}`);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    garbaAudio.playDhol();
    setBookingLoading(true);
    setBookingError(null);

    // Removed Single Pass Female rule to allow any gender to book

    // Validate in-batch unique Aadhaar and required fields
    const batchAadhaarSet = new Set<string>();

    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];
      if (!att.fullName.trim()) {
        setBookingError(`Full name is required for attendee #${i + 1}`);
        setBookingLoading(false);
        return;
      }
      if (att.phone.replace(/\D/g, '').length < 10) {
        setBookingError(`Valid WhatsApp phone required for attendee #${i + 1} (${att.fullName})`);
        setBookingLoading(false);
        return;
      }
      const cleanAadhaar = att.aadhaarNumber.replace(/\D/g, '');
      if (cleanAadhaar.length !== 12) {
        setBookingError(`Valid 12-digit Aadhaar number required for attendee #${i + 1} (${att.fullName})`);
        setBookingLoading(false);
        return;
      }

      if (batchAadhaarSet.has(cleanAadhaar)) {
        setBookingError(`Each attendee must have a unique Aadhaar card. Duplicate Aadhaar number entered for attendee #${i + 1} (${att.fullName}).`);
        setBookingLoading(false);
        return;
      }
      batchAadhaarSet.add(cleanAadhaar);

      if (!att.documentKey) {
        setBookingError(`Aadhaar document upload is mandatory for attendee #${i + 1} (${att.fullName})`);
        setBookingLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/registrations/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passType: selectedPass,
          attendees: attendees.map((a) => ({
            fullName: a.fullName,
            phone: a.phone.startsWith('+91') ? a.phone : `+91${a.phone.replace(/\D/g, '')}`,
            email: a.email || undefined,
            gender: a.gender,
            aadhaarNumber: a.aadhaarNumber.replace(/\D/g, ''),
            documentKey: a.documentKey,
            originalFilename: a.documentName,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Registration failed');
      }

      setSubmittedApplication(json.data);
      garbaAudio.playGhunghroo();
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleWalletSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = walletPhone.replace(/\D/g, '');
    if (!cleanDigits) return;
    garbaAudio.playDandiya();
    setWalletLoading(true);
    setWalletSearched(true);
    setWalletPasses([]);

    try {
      const res = await fetch(`${API_BASE}/credentials/my-pass?query=${encodeURIComponent(cleanDigits)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setWalletPasses(json.data);
        if (json.data.length > 0) garbaAudio.playGhunghroo();
      }
    } catch (err) {
      console.error('Failed to search wallet passes:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  const openPaymentModal = async (paymentLinkId: string) => {
    garbaAudio.playDandiya();
    setActivePaymentLink(paymentLinkId);
    setPaymentOrder(null);
    setPaymentSuccessData(null);
    setPaymentLoading(true);

    try {
      const res = await fetch(`${API_BASE}/payments/order/${paymentLinkId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPaymentOrder(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activePaymentLink) return;
    garbaAudio.playDhol();
    setPaymentLoading(true);

    try {
      const res = await fetch(`${API_BASE}/payments/gateway-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentLinkId: activePaymentLink,
          providerReference: `UPI-APP-TXN-${Date.now().toString().slice(-6)}`,
          notes: 'Customer paid online via dynamic UPI QR checkout modal',
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setPaymentSuccessData(json.data);
        garbaAudio.playGhunghroo();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2D1F0E] font-sans selection:bg-[#F6C85F]/50 selection:text-[#2D1F0E] relative overflow-x-hidden">
      {/* Visual Sunlit Canvas */}
      <IllusionEngine />

      {/* Atmospheric Top Glow */}
      <div className="fixed top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#FFF9EE]/80 to-transparent pointer-events-none z-10" />

      {/* HEADER / NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAD9B8] px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" onClick={() => garbaAudio.playDandiya()}>
            <LogoSlot size="sm" showText={true} showDate={false} />
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-xs tracking-[0.2em] uppercase font-semibold text-[#6E5336]">
            <a href="#call" className={`relative hover:text-[#D99427] transition-colors duration-300 pb-1.5 ${activeSection === 'call' ? 'text-[#D99427]' : ''}`} onMouseEnter={() => garbaAudio.playDandiya(0.15)}>
              The Concept
              <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-[#D99427] transition-transform duration-500 delay-100 ease-out origin-left ${activeSection === 'call' ? 'scale-x-100' : 'scale-x-0'}`} />
            </a>
            <a href="#colour" className={`relative hover:text-[#D99427] transition-colors duration-300 pb-1.5 ${activeSection === 'colour' ? 'text-[#D99427]' : ''}`} onMouseEnter={() => garbaAudio.playDandiya(0.15)}>
              Dress Code
              <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-[#D99427] transition-transform duration-500 delay-100 ease-out origin-left ${activeSection === 'colour' ? 'scale-x-100' : 'scale-x-0'}`} />
            </a>
            <a href="#gazebos" className={`relative hover:text-[#D99427] transition-colors duration-300 pb-1.5 ${activeSection === 'gazebos' ? 'text-[#D99427]' : ''}`} onMouseEnter={() => garbaAudio.playDandiya(0.15)}>
              Gazebo Lounges
              <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-[#D99427] transition-transform duration-500 delay-100 ease-out origin-left ${activeSection === 'gazebos' ? 'scale-x-100' : 'scale-x-0'}`} />
            </a>
            <a href="#sponsors" className={`relative hover:text-[#D99427] transition-colors duration-300 pb-1.5 ${activeSection === 'sponsors' ? 'text-[#D99427]' : ''}`} onMouseEnter={() => garbaAudio.playDandiya(0.15)}>
              Our Partners
              <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-[#D99427] transition-transform duration-500 delay-100 ease-out origin-left ${activeSection === 'sponsors' ? 'scale-x-100' : 'scale-x-0'}`} />
            </a>
            <a href="#passes" className={`relative hover:text-[#D99427] transition-colors duration-300 pb-1.5 ${activeSection === 'passes' ? 'text-[#D99427]' : ''}`} onMouseEnter={() => garbaAudio.playDandiya(0.15)}>
              Passes
              <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-[#D99427] transition-transform duration-500 delay-100 ease-out origin-left ${activeSection === 'passes' ? 'scale-x-100' : 'scale-x-0'}`} />
            </a>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Interactive Sound FX Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-1.5 sm:p-2 rounded-full bg-[#FAF6EE] border border-[#EAD9B8] hover:bg-[#F3ECE0] text-[#8C6019] transition shadow-sm"
              title={isSoundMuted ? 'Unmute Festive Audio' : 'Mute Festive Audio'}
            >
              {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D99427] animate-pulse" />}
            </button>

            <button
              onClick={() => {
                garbaAudio.playGhunghroo();
                setIsWalletOpen(true);
              }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold tracking-wider text-[#6E5336] bg-[#F8F5EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] rounded-full transition shadow-sm whitespace-nowrap"
            >
              My Pass
            </button>
            <a
              href="#passes"
              onClick={() => garbaAudio.playDhol()}
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold tracking-wider text-[#2D1F0E] bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] hover:opacity-95 rounded-full transition shadow-md shadow-[#D99427]/20 whitespace-nowrap"
            >
              Book Pass
            </a>
          </div>
        </div>
      </header>

      {/* 75% WHITE RULE FLOATING COMPULSORY BANNER */}
      {showDressCode && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-30 bg-white/95 backdrop-blur-lg border-2 border-[#D99427] rounded-2xl p-4 shadow-xl shadow-[#D99427]/10 flex items-center space-x-4 animate-fade-in relative pr-10">
          <button 
            onClick={() => setShowDressCode(false)}
            className="absolute top-2 right-2 p-1 text-[#A3927B] hover:text-[#2D1F0E] hover:bg-[#FAF6EE] rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-11 h-11 rounded-xl bg-[#FFF5DC] border border-[#E5A93C] flex-shrink-0 flex items-center justify-center">
            <span className="text-xl">☀️</span>
          </div>
          <div className="text-xs">
            <div className="font-serif font-bold text-[#8C6019] tracking-wide uppercase text-[11px]">
              Compulsory Dress Code
            </div>
            <p className="text-[#6E5336] text-[11px] leading-snug mt-0.5">
              <strong className="text-[#2D1F0E]">75% White Rule:</strong> At least 75% of your visible attire must be pure white. Entry is strictly conditional on adherence.
            </p>
          </div>
        </div>
      )}

      {/* HERO SECTION WITH OFFICIAL LOGO */}
      <section id="call" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-16 z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex justify-center mb-2">
            <div 
              className="relative p-2 rounded-full bg-gradient-to-b from-[#FFF9EE] via-[#FDFBF7] to-[#F5EFEB] shadow-xl border-2 border-[#EAD9B8] cursor-pointer hover:scale-105 transition"
              onClick={() => garbaAudio.playGhunghroo()}
            >
              <LogoSlot size="hero" />
            </div>
          </div>

          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#FFF9EE] border border-[#EAD9B8]">
            <span className="w-2 h-2 rounded-full bg-[#D99427] animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.25em] text-[#8C6019] uppercase">
              The Grand Heritage Arena • Rajkot • Navratri 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-7xl font-serif font-extralight tracking-tight text-[#2D1F0E] leading-tight">
            SAFED <span className="italic font-bold text-[#D99427]">SHERI</span>
          </h1>

          <p className="text-xl md:text-2xl font-serif text-[#6E5336] tracking-wide max-w-2xl mx-auto">
            One Night. One Colour. Infinite Memories.
          </p>

          <p className="text-xs md:text-sm text-[#8C6019] tracking-[0.15em] uppercase max-w-xl mx-auto leading-relaxed">
            A sacred confluence of Navratri devotion, pure white traditional elegance, and radiant acoustic bliss.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#passes"
              onClick={() => garbaAudio.playDhol()}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-[0.2em] uppercase rounded-full shadow-lg shadow-[#D99427]/30 hover:scale-105 transition"
            >
              Get Your Pass
            </a>
            <button
              onClick={() => {
                garbaAudio.playGhunghroo();
                setIsWalletOpen(true);
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#F8F5EE] text-[#2D1F0E] border-2 border-[#EAD9B8] font-bold text-xs tracking-[0.2em] uppercase rounded-full transition shadow-sm"
            >
              Check Pass Status
            </button>
          </div>

          <div className="pt-10 grid grid-cols-3 gap-6 max-w-lg mx-auto border-t border-[#EAD9B8] text-center">
            <div className="cursor-pointer" onClick={() => garbaAudio.playDandiya()}>
              <div className="text-2xl font-serif font-bold text-[#2D1F0E]">09.10</div>
              <div className="text-[10px] tracking-[0.2em] font-semibold text-[#8C6019] uppercase">October 2026</div>
            </div>
            <div className="cursor-pointer" onClick={() => garbaAudio.playDhol()}>
              <div className="text-2xl font-serif font-bold text-[#2D1F0E]">100%</div>
              <div className="text-[10px] tracking-[0.2em] font-semibold text-[#8C6019] uppercase">White Garba</div>
            </div>
            <div className="cursor-pointer" onClick={() => garbaAudio.playGhunghroo()}>
              <div className="text-2xl font-serif font-bold text-[#2D1F0E]">Rajkot</div>
              <div className="text-[10px] tracking-[0.2em] font-semibold text-[#8C6019] uppercase">Gujarat</div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 2: THE COLOUR & 75% WHITE RULE */}
      <section id="colour" className="relative py-24 px-6 z-10 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9] border-t border-b border-[#EAD9B8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-[11px] font-bold tracking-[0.3em] text-[#8C6019] uppercase">Chapter II</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#2D1F0E]">The Identity of White</h2>
            <p className="text-sm text-[#6E5336] leading-relaxed">
              White is the soul of Safed Sheri. Under the golden sunburst and starlit sky, an entire arena moves as one.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="p-8 rounded-3xl bg-white border-2 border-[#E5A93C] shadow-xl shadow-[#D99427]/10 relative overflow-hidden">
              <div className="text-xs font-mono font-bold text-[#8C6019] uppercase tracking-widest mb-2">MANDATORY RULE</div>
              <h3 className="text-2xl font-serif font-bold text-[#2D1F0E] mb-3">75% White Attire Requirement</h3>
              <p className="text-xs text-[#6E5336] leading-relaxed mb-6">
                All guests must be dressed in at least <strong>75% white visible attire</strong> (Traditional Chaniya Choli, Kurta, Kediya, or Formal Indian White).
              </p>
              <div className="space-y-3 text-xs text-[#6E5336]">
                <div className="flex items-center space-x-3">
                  <span className="text-[#D99427] font-bold text-sm">✓</span>
                  <span>Pure White, Pearl White, Ivory & Off-White accepted</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[#D99427] font-bold text-sm">✓</span>
                  <span>Subtle Royal Gold embroidery & mirror work permitted</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-red-500 font-bold text-sm">✕</span>
                  <span>Non-white outfits will be strictly denied entry at the gate</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-[#EAD9B8] shadow-md space-y-5">
              <div className="text-xs font-mono font-bold text-[#8C6019] uppercase tracking-widest">VERIFIED IDENTITY</div>
              <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">Government ID Authentication</h3>
              <p className="text-xs text-[#6E5336] leading-relaxed">
                To guarantee security and an exclusive cultural atmosphere, every pass is individually authenticated with mandatory Aadhaar verification.
              </p>
              <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#EAD9B8] flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#F6C85F]/30 border border-[#E5A93C] flex items-center justify-center text-lg">🛡️</div>
                <div className="text-xs">
                  <div className="font-bold text-[#2D1F0E]">Encrypted Aadhaar Storage</div>
                  <div className="text-[#6E5336] text-[11px]">Protected by 256-bit server HMAC hashing and private storage.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 4: VIP GAZEBO CABANAS (PRIVATE PRICING / INQUIRY ONLY) */}
      <section id="gazebos" className="relative py-24 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-[11px] font-bold tracking-[0.3em] text-[#8C6019] uppercase">Chapter IV</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#2D1F0E]">VIP Gazebo Cabanas</h2>
            <p className="text-sm text-[#6E5336] leading-relaxed">
              Elevated private viewing lounges overlooking the sacred garba circle. Dedicated concierge and butler hospitality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-[#EAD9B8] shadow-md flex flex-col justify-between space-y-6 hover:border-[#D99427] transition">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#FFF5DC] text-[#8C6019] border border-[#EAD9B8]">
                  LEVEL 1
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#2D1F0E] mt-3">Elevated Amphitheater</h3>
                <p className="text-xs text-[#6E5336] mt-2 leading-relaxed">
                  Prime tier elevation right on the edge of the acoustic garba circle. Seats 10-12 guests.
                </p>
                <div className="mt-6 pt-4 border-t border-[#EAD9B8]">
                  <div className="text-xs text-[#6E5336]">Hospitality Pricing:</div>
                  <div className="text-lg font-serif font-bold text-[#D99427] italic">
                    Price on Request • VIP Inquiry Only
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePassSelect('GAZEBO')}
                className="w-full py-3 rounded-2xl bg-[#2D1F0E] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#4A351B] transition shadow-md"
              >
                Inquire Level 1 Lounge
              </button>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#FFF9EE] to-white border-2 border-[#D99427] shadow-xl flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] text-[10px] font-extrabold tracking-widest uppercase shadow-md">
                Royal Tier
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#FFF5DC] text-[#8C6019] border border-[#E5A93C]">
                  LEVEL 2
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#2D1F0E] mt-3">Royal Pavilion</h3>
                <p className="text-xs text-[#6E5336] mt-2 leading-relaxed">
                  Center stage panoramic viewing deck with luxury plush sofas and dedicated valet. Seats 12-15 guests.
                </p>
                <div className="mt-6 pt-4 border-t border-[#EAD9B8]">
                  <div className="text-xs text-[#6E5336]">Hospitality Pricing:</div>
                  <div className="text-lg font-serif font-bold text-[#D99427] italic">
                    Price on Request • VIP Inquiry Only
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePassSelect('GAZEBO')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition shadow-lg shadow-[#D99427]/25"
              >
                Inquire Royal Pavilion
              </button>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-[#EAD9B8] shadow-md flex flex-col justify-between space-y-6 hover:border-[#D99427] transition">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#FFF5DC] text-[#8C6019] border border-[#EAD9B8]">
                  LEVEL 3
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#2D1F0E] mt-3">Imperial Sky Lounge</h3>
                <p className="text-xs text-[#6E5336] mt-2 leading-relaxed">
                  Highest elevation private sky cabana with bespoke chef curation and private security cordon.
                </p>
                <div className="mt-6 pt-4 border-t border-[#EAD9B8]">
                  <div className="text-xs text-[#6E5336]">Hospitality Pricing:</div>
                  <div className="text-lg font-serif font-bold text-[#D99427] italic">
                    Price on Request • VIP Inquiry Only
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePassSelect('GAZEBO')}
                className="w-full py-3 rounded-2xl bg-[#2D1F0E] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#4A351B] transition shadow-md"
              >
                Inquire Imperial Lounge
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 5: 3D INTERACTIVE SPONSORS & BRANDS GALLERY */}
      <div id="sponsors">
        <Sponsor3DGallery 
          onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
        />
      </div>

      {/* URGENCY REVERSE COUNTDOWN STOP WATCH TICKER BANNER */}
      {pricing?.isCountdownActive && !timeLeft.expired && (
        <div className="bg-gradient-to-r from-[#2D1F0E] via-[#3E2B14] to-[#2D1F0E] text-white py-5 px-6 border-y-2 border-[#D99427]/60 shadow-2xl relative z-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#D99427]/20 border border-[#D99427]/50 flex items-center justify-center text-[#F6C85F] shadow-inner animate-pulse flex-shrink-0">
                <Timer className="w-6 h-6 text-[#F6C85F]" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-2 text-[10px] font-mono tracking-widest font-bold text-[#F6C85F] uppercase mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-1" />
                  LIMITED TIME REVERSE COUNTDOWN • {pricing.phaseName} PHASE
                </div>
                <div className="text-xs md:text-sm font-serif font-bold text-white tracking-wide">
                  {pricing.urgencyTagline || 'Lock in your passes at current phase rates before price escalates!'}
                </div>
              </div>
            </div>

            {/* STOP WATCH FLIP DIGITS */}
            <div className="flex items-center space-x-2 font-mono">
              <div className="bg-white/10 border border-[#D99427]/50 rounded-2xl px-3.5 py-2 text-center min-w-[56px] shadow-lg">
                <div className="text-xl md:text-2xl font-bold font-serif text-[#F6C85F] leading-none">{String(timeLeft.days).padStart(2, '0')}</div>
                <div className="text-[9px] text-[#EAD9B8] uppercase tracking-wider font-bold mt-1">Days</div>
              </div>
              <span className="text-[#F6C85F] font-bold text-xl">:</span>
              <div className="bg-white/10 border border-[#D99427]/50 rounded-2xl px-3.5 py-2 text-center min-w-[56px] shadow-lg">
                <div className="text-xl md:text-2xl font-bold font-serif text-[#F6C85F] leading-none">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-[9px] text-[#EAD9B8] uppercase tracking-wider font-bold mt-1">Hours</div>
              </div>
              <span className="text-[#F6C85F] font-bold text-xl">:</span>
              <div className="bg-white/10 border border-[#D99427]/50 rounded-2xl px-3.5 py-2 text-center min-w-[56px] shadow-lg">
                <div className="text-xl md:text-2xl font-bold font-serif text-[#F6C85F] leading-none">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-[9px] text-[#EAD9B8] uppercase tracking-wider font-bold mt-1">Mins</div>
              </div>
              <span className="text-[#F6C85F] font-bold text-xl">:</span>
              <div className="bg-white/10 border border-[#D99427]/50 rounded-2xl px-3.5 py-2 text-center min-w-[56px] shadow-lg">
                <div className="text-xl md:text-2xl font-bold font-serif text-[#F6C85F] leading-none">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-[9px] text-[#EAD9B8] uppercase tracking-wider font-bold mt-1">Secs</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER 6: PASS SELECTION & BOOKING */}
      <section id="passes" className="relative py-24 px-6 z-10 bg-[#FFFDF9] border-t border-[#EAD9B8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-[11px] font-bold tracking-[0.3em] text-[#8C6019] uppercase">Chapter VI</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#2D1F0E]">Reserve Your Pass</h2>
            <p className="text-sm text-[#6E5336] leading-relaxed">
              Step into the sacred circle. Passes are limited to preserve acoustic purity, intimacy, and safety.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* SINGLE PASS (FEMALE ONLY) */}
            <div 
              className="p-8 rounded-3xl bg-white border border-[#EAD9B8] shadow-lg flex flex-col justify-between hover:border-[#D99427] transition"
              onMouseEnter={() => garbaAudio.playDandiya(0.1)}
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#FFF0F5] text-purple-800 border border-purple-200">
                    Female Only
                  </span>
                  <span className="text-xs text-[#8C6019] font-mono">1-7 Passes</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#2D1F0E] mb-2">Single Pass</h3>
                <p className="text-xs text-[#6E5336] leading-relaxed mb-6">
                  Individual entry pass exclusively reserved for female attendees.
                </p>

                {/* PRICE VISIBILITY TOGGLE CHECK */}
                {pricing.showSinglePrice ? (
                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-serif font-bold text-[#2D1F0E]">
                        ₹{pricing.singlePrice?.toLocaleString()}
                      </span>
                      {pricing.nextSinglePrice && (
                        <span className="text-xs font-mono text-gray-400 line-through">
                          ₹{pricing.nextSinglePrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] tracking-wider font-bold text-[#8C6019] uppercase mt-1">
                      {pricing.phaseName} PHASE
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="px-4 py-2 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#8C6019] font-bold text-xs inline-flex items-center space-x-2 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-[#D99427]" />
                      <span>{pricing.hiddenPriceLabel || 'Price Revealed on Approval'}</span>
                    </div>
                    <div className="text-[10px] tracking-wider font-bold text-[#6E5336] uppercase mt-2">
                      EXCLUSIVELY ALLOCATED TIER
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 text-xs text-[#6E5336] mb-8 border-t border-[#EAD9B8] pt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#D99427] font-bold">✓</span>
                    <span>1 Verified Female Entry per Pass</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#D99427] font-bold">✓</span>
                    <span>Unique Dynamic QR Pass</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#D99427] font-bold">✓</span>
                    <span>75% White Attire Compulsory</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePassSelect('SINGLE')}
                className="w-full py-3.5 rounded-2xl bg-[#2D1F0E] text-white font-bold text-xs tracking-widest uppercase hover:bg-[#4A351B] transition shadow-md"
              >
                Apply for Single Pass
              </button>
            </div>

            {/* COUPLE PASS */}
            <div 
              className="p-8 rounded-3xl bg-gradient-to-b from-[#FFF9EE] to-white border-2 border-[#D99427] shadow-xl relative flex flex-col justify-between hover:shadow-2xl transition"
              onMouseEnter={() => garbaAudio.playDhol(0.15)}
            >
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] text-[10px] font-extrabold tracking-widest uppercase shadow-md">
                Most Popular
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#FFF5DC] text-[#8C6019] border border-[#E5A93C]">
                    Couple Entry
                  </span>
                  <span className="text-xs text-[#8C6019] font-mono">2 Attendees</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#2D1F0E] mb-2">Couple Pass</h3>
                <p className="text-xs text-[#6E5336] leading-relaxed mb-6">
                  Verified entry for two attendees (1 Female + 1 Male or 2 Females).
                </p>

                {/* PRICE VISIBILITY TOGGLE CHECK */}
                {pricing.showCouplePrice ? (
                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-serif font-bold text-[#2D1F0E]">
                        ₹{pricing.couplePrice?.toLocaleString()}
                      </span>
                      {pricing.nextCouplePrice && (
                        <span className="text-xs font-mono text-gray-400 line-through">
                          ₹{pricing.nextCouplePrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] tracking-wider font-bold text-[#8C6019] uppercase mt-1">
                      {pricing.phaseName} PHASE
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="px-4 py-2 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#8C6019] font-bold text-xs inline-flex items-center space-x-2 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-[#D99427]" />
                      <span>{pricing.hiddenPriceLabel || 'Price Revealed on Approval'}</span>
                    </div>
                    <div className="text-[10px] tracking-wider font-bold text-[#6E5336] uppercase mt-2">
                      COUPLE PRIVILEGE ALLOCATION
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 text-xs text-[#6E5336] mb-8 border-t border-[#EAD9B8] pt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#D99427] font-bold">✓</span>
                    <span>2 Individually Verified Attendees</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#D99427] font-bold">✓</span>
                    <span>2 Unique Dynamic QR Passes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#D99427] font-bold">✓</span>
                    <span>75% White Attire Compulsory</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePassSelect('COUPLE')}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 transition shadow-lg shadow-[#D99427]/30"
              >
                Apply for Couple Pass
              </button>
            </div>

            {/* GAZEBO LOUNGE */}
            <div 
              className="p-8 rounded-3xl bg-white border border-[#EAD9B8] shadow-lg flex flex-col justify-between hover:border-[#D99427] transition"
              onMouseEnter={() => garbaAudio.playGhunghroo(0.1)}
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#FFF5DC] text-[#8C6019] border border-[#EAD9B8]">
                    VIP Hospitality
                  </span>
                  <span className="text-xs text-[#8C6019] font-mono">10-15 Guests</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#2D1F0E] mb-2">Gazebo Lounge</h3>
                <p className="text-xs text-[#6E5336] leading-relaxed mb-6">
                  Elevated private cabana with dedicated concierge, bespoke seating, and butler service.
                </p>
                <div className="text-xl font-serif font-bold text-[#D99427] mb-1 italic">
                  Price on Request
                </div>
                <div className="text-[10px] tracking-wider font-bold text-[#8C6019] uppercase mb-6">
                  VIP Hospitality Inquiry Only
                </div>

                <div className="space-y-2.5 text-xs text-[#6E5336] mb-8 border-t border-[#EAD9B8] pt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#D99427] font-bold">✓</span>
                    <span>Private Elevated Viewing Lounge</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#D99427] font-bold">✓</span>
                    <span>Dedicated VIP Valet & Entry Gate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#D99427] font-bold">✓</span>
                    <span>Curated Gourmet Dining</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePassSelect('GAZEBO')}
                className="w-full py-3.5 rounded-2xl bg-[#F8F5EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase transition shadow-sm"
              >
                Inquire Gazebo Lounge
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#EAD9B8] py-10 px-6 bg-[#FAF6EE] z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#6E5336]">
          <div className="flex items-center space-x-3">
            <LogoSlot size="sm" showText={true} showDate={false} />
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-semibold">
            <a href="#call" className="hover:text-[#D99427] transition" onClick={() => garbaAudio.playDandiya()}>The Concept</a>
            <a href="#colour" className="hover:text-[#D99427] transition" onClick={() => garbaAudio.playDandiya()}>75% White Rule</a>
            <a href="#gazebos" className="hover:text-[#D99427] transition" onClick={() => garbaAudio.playDandiya()}>Gazebo Lounges</a>
            <a href="#sponsors" className="hover:text-[#D99427] transition" onClick={() => garbaAudio.playDandiya()}>Brand Partners</a>
            <a href="#passes" className="hover:text-[#D99427] transition" onClick={() => garbaAudio.playDandiya()}>Pass Privilege</a>
          </div>

          <div className="text-center md:text-right">
            <div className="font-semibold text-[#2D1F0E]">The Grand Heritage Arena • Kalawad Road, Rajkot, Gujarat</div>
            <div className="text-[11px] text-[#8C6019] mt-0.5">© 2026 Safed Sheri Cultural Gala. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1: GUEST REGISTRATION APPLICATION CAROUSEL WIZARD (UP TO 7 PASSES) */}
      {/* ========================================================================= */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex justify-center items-center py-6 px-3 sm:px-6 animate-fade-in">
          <div className="bg-[#FFFCF7] border-2 border-[#EAD9B8] rounded-[2.5rem] w-full max-w-3xl shadow-2xl relative text-[#2D1F0E] p-6 sm:p-10 my-auto">
            
            {/* Header Actions */}
            <div className="flex items-center justify-between border-b border-[#EAD9B8] pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <LogoSlot size="sm" />
                <div>
                  <span className="text-[10px] font-mono tracking-widest font-bold text-[#8C6019] uppercase block">
                    SAFED SHERI 2026 • OFFICIAL REGISTRATION
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F0E]">
                    {selectedPass} Pass Booking
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleResetDraft}
                  title="Reset Draft Form"
                  className="px-3 py-1.5 rounded-full bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[11px] font-bold text-[#6E5336] flex items-center space-x-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={() => setIsBookingOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#F8F5EE] text-[#6E5336] hover:text-[#2D1F0E] flex items-center justify-center border border-[#EAD9B8] text-sm font-bold shadow-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {!submittedApplication ? (
              <form onSubmit={handleBookingSubmit} className="space-y-6">

                {/* STEP INDICATOR BREADCRUMB */}
                <div className="flex items-center justify-between bg-[#F8F3E8] p-3 sm:p-4 rounded-2xl border border-[#EAD9B8]">
                  <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto text-xs font-semibold">
                    
                    {/* Step 1: Pass Quantity (for Single) */}
                    {selectedPass === 'SINGLE' && (
                      <button
                        type="button"
                        onClick={() => { garbaAudio.playDandiya(); setWizardStep('QUANTITY'); }}
                        className={`px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition whitespace-nowrap ${
                          wizardStep === 'QUANTITY'
                            ? 'bg-[#D99427] text-white font-bold shadow-sm'
                            : 'bg-white text-[#6E5336] border border-[#EAD9B8]'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Passes ({attendees.length})</span>
                      </button>
                    )}

                    {/* Attendee Steps */}
                    {attendees.map((att, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (wizardStep === 'QUANTITY') {
                            setWizardStep('ATTENDEE');
                          }
                          garbaAudio.playDandiya();
                          setCurrentAttendeeIndex(idx);
                        }}
                        className={`px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition whitespace-nowrap ${
                          wizardStep === 'ATTENDEE' && currentAttendeeIndex === idx
                            ? 'bg-[#D99427] text-white font-bold shadow-sm'
                            : att.fullName && att.aadhaarNumber && att.documentKey
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                            : 'bg-white text-[#6E5336] border border-[#EAD9B8]'
                        }`}
                      >
                        <span>#{idx + 1} {att.fullName ? att.fullName.split(' ')[0] : `Guest ${idx + 1}`}</span>
                        {att.fullName && att.aadhaarNumber && att.documentKey && (
                          <Check className="w-3 h-3 text-emerald-700" />
                        )}
                      </button>
                    ))}

                    {/* Review Step */}
                    <button
                      type="button"
                      onClick={() => {
                        let allValid = true;
                        for (let i = 0; i < attendees.length; i++) {
                          if (!validateCurrentAttendee(i)) {
                            setCurrentAttendeeIndex(i);
                            setWizardStep('ATTENDEE');
                            allValid = false;
                            break;
                          }
                        }
                        if (allValid) {
                          garbaAudio.playDandiya();
                          setWizardStep('SUMMARY');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition whitespace-nowrap ${
                        wizardStep === 'SUMMARY'
                          ? 'bg-[#D99427] text-white font-bold shadow-sm'
                          : 'bg-white text-[#6E5336] border border-[#EAD9B8]'
                      }`}
                    >
                      <span>Review & Submit</span>
                    </button>
                  </div>

                  <div className="text-[11px] font-mono font-bold text-[#8C6019] hidden sm:block">
                    Draft Saved ✓
                  </div>
                </div>

                {bookingError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-3 shadow-sm">
                    <span className="text-base">⚠️</span>
                    <span className="font-medium">{bookingError}</span>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 1 VIEW: ULTRA-LUXURY PASS COUNTER */}
                {/* ========================================================================= */}
                {wizardStep === 'QUANTITY' && (
                  <div className="space-y-6 animate-fade-in py-2">
                    <div className="text-center space-y-2">
                      <span className="text-xs font-mono font-bold text-[#8C6019] uppercase tracking-widest">
                        STEP 1 OF 3 • SELECT PASS QUANTITY
                      </span>
                      <h4 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D1F0E]">
                        How many passes do you wish to book?
                      </h4>
                      <p className="text-xs text-[#6E5336] max-w-md mx-auto">
                        A single applicant can book up to <strong>7 female passes</strong> in a single reservation.
                      </p>
                    </div>

                    {/* Luxury Counter Box */}
                    <div className="p-8 rounded-3xl bg-gradient-to-b from-[#FFFDF9] to-[#F8F3E8] border-2 border-[#EAD9B8] shadow-lg max-w-md mx-auto text-center space-y-6">
                      <div className="flex items-center justify-center space-x-6">
                        <button
                          type="button"
                          onClick={handlePassQuantityDecrement}
                          disabled={attendees.length <= 1}
                          className="w-14 h-14 rounded-2xl bg-white border border-[#EAD9B8] hover:border-[#D99427] text-[#2D1F0E] flex items-center justify-center text-xl font-bold shadow-md hover:scale-105 active:scale-95 transition disabled:opacity-40"
                        >
                          <Minus className="w-6 h-6" />
                        </button>

                        <div className="space-y-1">
                          <div className="text-5xl sm:text-6xl font-serif font-black text-[#8C6019] tracking-tight">
                            {attendees.length < 10 ? `0${attendees.length}` : attendees.length}
                          </div>
                          <div className="text-xs font-mono tracking-widest uppercase font-bold text-[#6E5336]">
                            {attendees.length === 1 ? 'PASS SELECTED' : 'PASSES SELECTED'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handlePassQuantityIncrement}
                          disabled={attendees.length >= 7}
                          className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] flex items-center justify-center text-xl font-bold shadow-md hover:scale-105 active:scale-95 transition disabled:opacity-40"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Seat Slots Preview */}
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-[#EAD9B8]/60">
                        {attendees.map((_, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full bg-white border border-[#EAD9B8] text-[11px] font-bold text-[#8C6019] shadow-sm flex items-center space-x-1"
                          >
                            <span>👸</span>
                            <span>{i === 0 ? 'Primary Contact' : `Guest #${i + 1}`}</span>
                          </span>
                        ))}
                      </div>

                      {/* Amount Due Card */}
                      <div className="p-4 rounded-2xl bg-white border border-[#EAD9B8] text-xs text-[#2D1F0E] space-y-1 shadow-sm">
                        {pricing.showSinglePrice ? (
                          <>
                            <div className="text-[#6E5336]">Phase Pricing: ₹{pricing.singlePrice?.toLocaleString()} per pass</div>
                            <div className="text-xl font-serif font-bold text-[#D99427]">
                              Total: ₹{(pricing.singlePrice * attendees.length).toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs font-bold text-[#8C6019] flex items-center justify-center space-x-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#D99427]" />
                              <span>{pricing.hiddenPriceLabel || 'Price Revealed on Approval'}</span>
                            </div>
                            <div className="text-[11px] text-[#6E5336]">
                              Pass amounts will be confirmed upon executive document review.
                            </div>
                          </>
                        )}
                      </div>

                      {/* Terms and Conditions */}
                      <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAD9B8] mt-6 text-left shadow-sm animate-fade-in">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              id="terms-checkbox-single"
                              checked={termsAccepted}
                              onChange={(e) => setTermsAccepted(e.target.checked)}
                              className="w-5 h-5 text-[#D99427] bg-white border-[#D99427] rounded focus:ring-[#D99427] cursor-pointer accent-[#D99427]"
                            />
                          </div>
                          <div className="text-xs text-[#6E5336] w-full">
                            <label htmlFor="terms-checkbox-single" className="font-bold text-[#2D1F0E] text-sm cursor-pointer block">I agree to the Safed Sheri 2026 Terms &amp; Conditions</label>
                            <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-[#D99427] font-bold mt-1 hover:underline outline-none">
                              {showTerms ? 'Hide Details' : 'Read More'}
                            </button>

                            {showTerms && (
                              <ul className="list-disc pl-4 mt-3 space-y-2 opacity-90 leading-snug animate-fade-in">
                                <li><strong>MANDATORY 75% WHITE RULE:</strong> Entry is strictly conditional on adherence. You will be denied entry without refund if this is violated.</li>
                                <li><strong>NO REFUNDS:</strong> Passes are strictly non-refundable and non-transferable under any circumstances.</li>
                                <li><strong>RIGHT OF ADMISSION:</strong> Management reserves the right to refuse admission or remove anyone failing to comply with rules or causing a disturbance.</li>
                                <li><strong>VALID ID:</strong> Original Government ID matching the pass name is mandatory at the gate. No digital copies accepted.</li>
                              </ul>
                            )}
                            {termsError && (
                              <p className="mt-2 text-[11px] font-bold text-rose-600 animate-fade-in">⚠ You must accept the Terms & Conditions to continue.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!termsAccepted) { setTermsError(true); return; }
                          setTermsError(false);
                          handleNextStep();
                        }}
                        className="w-full py-4 mt-6 rounded-2xl bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-[#D99427]/20 flex items-center justify-center space-x-2 transition"
                      >
                        <span>Continue to Guest Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 2 VIEW: SINGLE ATTENDEE SLIDE-CARD (NO DOOM SCROLLING) */}
                {/* ========================================================================= */}
                {wizardStep === 'ATTENDEE' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#EAD9B8] pb-3">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-wider">
                          GUEST {currentAttendeeIndex + 1} OF {attendees.length}
                        </div>
                        <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F0E]">
                          {currentAttendeeIndex === 0 ? 'Primary Contact Details' : `Attendee #${currentAttendeeIndex + 1} Details`}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-[#8C6019] bg-[#FAF6EE] px-3 py-1 rounded-full border border-[#EAD9B8]">
                          {selectedPass} Pass
                        </span>
                        {selectedPass === 'SINGLE' && (
                          <span className="text-[10px] text-purple-800 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200 font-semibold">
                            Female Only
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ACTIVE ATTENDEE CARD */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#EAD9B8] shadow-md space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Full Legal Name *</label>
                          <input
                            type="text"
                            required
                            value={attendees[currentAttendeeIndex]?.fullName || ''}
                            onChange={(e) => {
                              const updated = [...attendees];
                              updated[currentAttendeeIndex].fullName = e.target.value;
                              setAttendees(updated);
                            }}
                            placeholder="As printed on government Aadhaar"
                            className="w-full px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Gender *</label>
                          <select
                            value={attendees[currentAttendeeIndex]?.gender || 'FEMALE'}
                            onChange={(e) => {
                              const updated = [...attendees];
                              updated[currentAttendeeIndex].gender = e.target.value as any;
                              setAttendees(updated);
                            }}
                            className="w-full px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none"
                          >
                            <option value="FEMALE">Female</option>
                            {selectedPass !== 'SINGLE' && <option value="MALE">Male</option>}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#6E5336] mb-1">WhatsApp Mobile (+91) *</label>
                          <input
                            type="tel"
                            required
                            maxLength={11}
                            value={formatPhoneNumber(attendees[currentAttendeeIndex]?.phone || '')}
                            onChange={(e) => {
                              const newDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                              const updated = [...attendees];
                              updated[currentAttendeeIndex].phone = newDigits;
                              if (currentAttendeeIndex === 0 && samePhoneForAll) {
                                for (let k = 1; k < updated.length; k++) {
                                  updated[k].phone = newDigits;
                                }
                              }
                              setAttendees(updated);
                            }}
                            placeholder="98765 43210"
                            className="w-full px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-mono tracking-wider focus:border-[#D99427] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Email Address (Optional)</label>
                          <input
                            type="email"
                            value={attendees[currentAttendeeIndex]?.email || ''}
                            onChange={(e) => {
                              const updated = [...attendees];
                              updated[currentAttendeeIndex].email = e.target.value;
                              setAttendees(updated);
                            }}
                            placeholder="guest@example.com"
                            className="w-full px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#6E5336] mb-1">12-Digit Aadhaar Number *</label>
                          <input
                            type="text"
                            required
                            maxLength={14}
                            value={formatAadhaarNumber(attendees[currentAttendeeIndex]?.aadhaarNumber || '')}
                            onChange={(e) => {
                              const updated = [...attendees];
                              updated[currentAttendeeIndex].aadhaarNumber = e.target.value.replace(/\D/g, '').slice(0, 12);
                              setAttendees(updated);
                            }}
                            placeholder="1234 5678 9012"
                            className="w-full px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-mono tracking-wider focus:border-[#D99427] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Mandatory Aadhaar Document *</label>
                          <div className="relative">
                            <input
                              key={`aadhaar-upload-key-${currentAttendeeIndex}`}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              onChange={(e) => handleFileUpload(currentAttendeeIndex, e)}
                              className="hidden"
                              id={`aadhaar-upload-${currentAttendeeIndex}`}
                            />
                            <label
                              htmlFor={`aadhaar-upload-${currentAttendeeIndex}`}
                              className="w-full px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-dashed border-[#D99427] text-[#6E5336] text-xs flex items-center justify-between cursor-pointer hover:bg-[#FFF9EE] transition"
                            >
                              <span className="truncate">
                                {attendees[currentAttendeeIndex]?.uploading
                                  ? 'Encrypting & uploading...'
                                  : attendees[currentAttendeeIndex]?.documentName || 'Upload ID Document (<5MB)'}
                              </span>
                              <span className="text-[10px] px-3 py-1 rounded bg-white font-bold text-[#8C6019] border border-[#EAD9B8]">
                                Browse
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Primary Contact Shared Phone Option */}
                      {currentAttendeeIndex === 0 && attendees.length > 1 && (
                        <label className="flex items-center space-x-2 text-xs text-[#2D1F0E] font-medium pt-3 cursor-pointer border-t border-[#EAD9B8]/60">
                          <input
                            type="checkbox"
                            checked={samePhoneForAll}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSamePhoneForAll(checked);
                              if (checked && attendees[0]?.phone) {
                                const primary = attendees[0].phone;
                                setAttendees(attendees.map((a) => ({ ...a, phone: primary })));
                              }
                            }}
                            className="w-4 h-4 rounded text-[#D99427] accent-[#D99427]"
                          />
                          <span>Automatically use this phone (+91 {formatPhoneNumber(attendees[0].phone)}) for all other guests</span>
                        </label>
                      )}
                    </div>

                    {/* Terms and Conditions — shown on Couple pass first guest screen */}
                    {selectedPass === 'COUPLE' && currentAttendeeIndex === 0 && (
                      <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAD9B8] mt-6 text-left shadow-sm animate-fade-in">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              id="terms-checkbox-couple"
                              checked={termsAccepted}
                              onChange={(e) => setTermsAccepted(e.target.checked)}
                              className="w-5 h-5 text-[#D99427] bg-white border-[#D99427] rounded focus:ring-[#D99427] cursor-pointer accent-[#D99427]"
                            />
                          </div>
                          <div className="text-xs text-[#6E5336] w-full">
                            <label htmlFor="terms-checkbox-couple" className="font-bold text-[#2D1F0E] text-sm cursor-pointer block">I agree to the Safed Sheri 2026 Terms &amp; Conditions</label>
                            <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-[#D99427] font-bold mt-1 hover:underline outline-none">
                              {showTerms ? 'Hide Details' : 'Read More'}
                            </button>

                            {showTerms && (
                              <ul className="list-disc pl-4 mt-3 space-y-2 opacity-90 leading-snug animate-fade-in">
                                <li><strong>MANDATORY 75% WHITE RULE:</strong> Entry is strictly conditional on adherence. You will be denied entry without refund if this is violated.</li>
                                <li><strong>NO REFUNDS:</strong> Passes are strictly non-refundable and non-transferable under any circumstances.</li>
                                <li><strong>RIGHT OF ADMISSION:</strong> Management reserves the right to refuse admission or remove anyone failing to comply with rules or causing a disturbance.</li>
                                <li><strong>VALID ID:</strong> Original Government ID matching the pass name is mandatory at the gate. No digital copies accepted.</li>
                              </ul>
                            )}
                            {termsError && (
                              <p className="mt-2 text-[11px] font-bold text-rose-600 animate-fade-in">⚠ You must accept the Terms &amp; Conditions to continue.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-6 py-3 rounded-full bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{currentAttendeeIndex === 0 && selectedPass === 'SINGLE' ? 'Pass Count' : 'Previous'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (selectedPass === 'COUPLE' && currentAttendeeIndex === 0 && !termsAccepted) {
                            setTermsError(true);
                            return;
                          }
                          setTermsError(false);
                          handleNextStep();
                        }}
                        className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-[#D99427]/20 flex items-center space-x-2 transition"
                      >
                        <span>
                          {currentAttendeeIndex < attendees.length - 1
                            ? `Next Attendee (Guest #${currentAttendeeIndex + 2})`
                            : 'Review Application'}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 3 VIEW: EXECUTIVE SUMMARY & FINAL SUBMISSION */}
                {/* ========================================================================= */}
                {wizardStep === 'SUMMARY' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center space-y-1">
                      <span className="text-xs font-mono font-bold text-[#8C6019] uppercase tracking-widest">
                        FINAL STEP • EXECUTIVE REVIEW
                      </span>
                      <h4 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D1F0E]">
                        Verify Details & Submit Booking
                      </h4>
                      <p className="text-xs text-[#6E5336]">
                        Please review all guest profiles below before submitting for executive review.
                      </p>
                    </div>

                    {/* Compact Review Cards */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {attendees.map((att, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white border border-[#EAD9B8] flex items-center justify-between text-xs shadow-sm hover:border-[#D99427] transition cursor-pointer"
                          onClick={() => {
                            garbaAudio.playDandiya();
                            setCurrentAttendeeIndex(idx);
                            setWizardStep('ATTENDEE');
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-7 h-7 rounded-full bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-mono font-bold text-[#8C6019] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-[#2D1F0E]">{att.fullName || `Guest #${idx + 1}`}</div>
                              <div className="text-[#6E5336] font-mono text-[11px] flex items-center space-x-2">
                                <span>Aadhaar: {formatAadhaarNumber(att.aadhaarNumber)}</span>
                                <span>•</span>
                                <span>+91 {formatPhoneNumber(att.phone)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                              {att.documentName ? 'Document Attached' : 'Missing Doc'}
                            </span>
                            <span className="text-[#D99427] text-xs font-bold hover:underline">Edit</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Summary */}
                    <div className="p-5 rounded-2xl bg-[#FFF9EE] border border-[#E5A93C] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#2D1F0E]">
                          Safed Sheri 2026 Entry Reservation ({attendees.length} {attendees.length === 1 ? 'Pass' : 'Passes'})
                        </div>
                        <div className="text-[11px] text-[#6E5336]">
                          Pass QR codes issued automatically upon executive approval & online payment.
                        </div>
                      </div>
                      {(selectedPass === 'SINGLE' ? pricing.showSinglePrice : pricing.showCouplePrice) ? (
                        <div className="text-2xl font-serif font-bold text-[#D99427]">
                          ₹{(selectedPass === 'COUPLE' ? pricing.couplePrice : pricing.singlePrice * attendees.length).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-[#8C6019] bg-[#FAF6EE] px-4 py-2 rounded-xl border border-[#EAD9B8] flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#D99427]" />
                          <span>{pricing.hiddenPriceLabel || 'Revealed on Approval'}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-6 py-3 rounded-full bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Edit Guests</span>
                      </button>

                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:scale-105 transition disabled:opacity-50 shadow-md shadow-[#D99427]/20 flex items-center space-x-2"
                      >
                        <span>{bookingLoading ? 'Submitting Application...' : `Submit Application (${attendees.length} ${attendees.length === 1 ? 'Pass' : 'Passes'})`}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              </form>
            ) : (
              /* SUBMISSION SUCCESS CONFIRMATION */
              <div className="text-center py-8 space-y-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center text-2xl mx-auto font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[#8C6019] uppercase tracking-widest mb-1">
                    APPLICATION SUBMITTED
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">
                    Application #{submittedApplication.registrationNumber}
                  </h3>
                  <p className="text-xs text-[#6E5336] max-w-md mx-auto mt-2 leading-relaxed">
                    Your booking application for <strong>{submittedApplication.passType}</strong> pass ({attendees.length} guest{attendees.length > 1 ? 's' : ''}) has been received and is currently <strong>Under Review</strong> by the executive team.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-[#2D1F0E] max-w-md mx-auto text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#6E5336]">Status:</span>
                    <span className="font-bold text-amber-700">UNDER REVIEW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E5336]">Total Passes:</span>
                    <span className="font-bold text-[#2D1F0E]">{attendees.length} Pass{attendees.length > 1 ? 'es' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E5336]">Amount Due:</span>
                    <span className="font-bold text-[#2D1F0E]">₹{submittedApplication.amountDue?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 pt-4">
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') localStorage.removeItem('safedsheri_booking_draft');
                      setIsBookingOpen(false);
                      setIsWalletOpen(true);
                    }}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs tracking-wider uppercase hover:opacity-90 transition shadow-md"
                  >
                    Open My Pass Wallet
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') localStorage.removeItem('safedsheri_booking_draft');
                      setIsBookingOpen(false);
                    }}
                    className="px-6 py-3 rounded-full bg-[#F8F5EE] text-[#2D1F0E] font-bold text-xs tracking-wider uppercase hover:bg-[#F3ECE0] border border-[#EAD9B8] transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MY PASS WALLET DRAWER */}
      {/* ========================================================================= */}
      {isWalletOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-[#EAD9B8] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative text-[#2D1F0E]">
            <button
              onClick={() => setIsWalletOpen(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F8F5EE] text-[#6E5336] hover:text-[#2D1F0E] flex items-center justify-center border border-[#EAD9B8]"
            >
              ✕
            </button>

            <div className="space-y-6">
              <div>
                <div className="inline-block text-[10px] font-mono tracking-widest font-bold text-[#8C6019] uppercase mb-1">
                  OFFICIAL PASS WALLET
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">My Safed Sheri Pass</h3>
                <p className="text-xs text-[#6E5336] mt-1">
                  Enter your registered <strong>WhatsApp Mobile Number</strong> or <strong>12-digit Aadhaar Number</strong> to retrieve your live pass & status.
                </p>
              </div>

              <form onSubmit={handleWalletSearch} className="flex gap-3">
                <input
                  type="text"
                  required
                  placeholder="Mobile (98765 43210) or Aadhaar (1234 5678 9012)"
                  value={formatSearchInput(walletPhone)}
                  onChange={(e) => setWalletPhone(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-mono tracking-wider focus:border-[#D99427] outline-none"
                />
                <button
                  type="submit"
                  disabled={walletLoading}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs tracking-wider uppercase hover:opacity-95 transition disabled:opacity-50 shadow-md"
                >
                  {walletLoading ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Refresh button after first search */}
              {walletSearched && !walletLoading && (
                <button
                  onClick={() => {
                    const cleanDigits = walletPhone.replace(/\D/g, '');
                    if (!cleanDigits) return;
                    setWalletLoading(true);
                    fetch(`${API_BASE}/credentials/my-pass?query=${encodeURIComponent(cleanDigits)}`)
                      .then(res => res.json())
                      .then(json => { if (json.success && json.data) setWalletPasses(json.data); })
                      .catch(console.error)
                      .finally(() => setWalletLoading(false));
                  }}
                  className="text-[11px] text-[#D99427] font-bold hover:underline flex items-center space-x-1"
                >
                  <span>↻ Refresh Status</span>
                </button>
              )}

              {/* SEARCH RESULTS */}
              {walletSearched && (
                <div className="space-y-4 pt-4 border-t border-[#EAD9B8]">
                  {walletPasses.length === 0 ? (
                    <div className="text-center py-8 text-[#6E5336] text-xs space-y-3">
                      <p>No booking records found for this phone or Aadhaar number.</p>
                      <button
                        onClick={() => {
                          setIsWalletOpen(false);
                          handlePassSelect('SINGLE');
                        }}
                        className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition"
                      >
                        Apply for a Pass Now
                      </button>
                    </div>
                  ) : (
                    walletPasses.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#EAD9B8] shadow-md space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-wider block">
                              {p.passType} PASS • {p.registrationNumber}
                            </span>
                            <h4 className="text-lg font-serif font-bold text-[#2D1F0E]">{p.attendeeName}</h4>
                            <div className="flex items-center space-x-3 text-xs text-[#6E5336] font-mono mt-0.5">
                              <span>Aadhaar: {p.aadhaarMasked ? p.aadhaarMasked.replace(/(\w{4})/g, '$1 ').trim() : 'XXXX XXXX XXXX'}</span>
                              <span>•</span>
                              <span>Mobile: +91 {formatPhoneNumber(p.phone)}</span>
                            </div>
                          </div>

                          <div>
                            {p.hasActivePass ? (
                              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                <span>PASS ACTIVE ✓</span>
                              </span>
                            ) : (p.isPaymentPending || p.registrationStatus === 'PAYMENT_PENDING' || p.registrationStatus === 'APPROVED') ? (
                              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 shadow-sm flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                <span>PAYMENT PENDING</span>
                              </span>
                            ) : (p.isUnderReview || p.registrationStatus === 'UNDER_REVIEW' || p.registrationStatus === 'SUBMITTED') ? (
                              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-100 text-blue-900 border border-blue-300 shadow-sm">
                                ⏳ UNDER REVIEW
                              </span>
                            ) : p.hasUsedPass ? (
                              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-800 border border-gray-300 shadow-sm flex items-center space-x-1">
                                <span>❌ USED PASS</span>
                              </span>
                            ) : (
                              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300 shadow-sm flex items-center space-x-1">
                                <span>✕ RESUBMISSION NEEDED</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 1. ACTIVE QR PASS DISPLAY */}
                        {p.hasActivePass && p.credential && (
                          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-white border-2 border-[#D99427] text-[#2D1F0E] text-center space-y-3 shadow-xl">
                            <div className="flex justify-center mb-1">
                              <LogoSlot size="sm" />
                            </div>
                            <div className="text-[10px] tracking-[0.25em] font-extrabold uppercase text-[#8C6019]">
                              SAFED SHERI 2026 • OFFICIAL ENTRY PASS
                            </div>

                            <div className="flex justify-center py-2">
                              <QRCodeSVG
                                value={p.credential.secureToken}
                                size={180}
                                level="H"
                                includeMargin={true}
                              />
                            </div>

                            <div className="text-xl font-mono font-extrabold tracking-widest text-[#2D1F0E]">
                              {p.credential.passCode}
                            </div>

                            <div className="text-xs text-[#6E5336] bg-[#FAF6EE] p-2.5 rounded-xl border border-[#EAD9B8]">
                              Present this digital pass at the Security Gate on <strong>09 October 2026</strong> • The Grand Heritage Arena, Rajkot.
                            </div>
                          </div>
                        )}

                        {/* 2. PAYMENT PENDING ACTION CARD */}
                        {(p.isPaymentPending || p.registrationStatus === 'PAYMENT_PENDING' || p.registrationStatus === 'APPROVED') && (
                          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-[#FFF9EE] border-2 border-amber-300 space-y-3 shadow-sm">
                            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                              <Sparkles className="w-4 h-4 text-[#D99427]" />
                              <span>KYC Approved! Online Payment Pending</span>
                            </div>
                            <p className="text-[11px] text-[#6E5336] leading-relaxed">
                              Your document verification is complete. Complete the online UPI payment of <strong>₹{p.amountDue?.toLocaleString() || '3,500'}</strong> to activate and download your official entry pass.
                            </p>
                            {p.paymentLinkId && (
                              <div className="pt-1 flex justify-end">
                                <button
                                  onClick={() => {
                                    setIsWalletOpen(false);
                                    openPaymentModal(p.paymentLinkId);
                                  }}
                                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider hover:scale-105 transition shadow-md flex items-center space-x-1.5"
                                >
                                  <span>Pay Now & Mint Pass →</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. UNDER REVIEW STATUS CARD */}
                        {(p.isUnderReview || p.registrationStatus === 'UNDER_REVIEW' || p.registrationStatus === 'SUBMITTED') && !p.hasActivePass && !p.isPaymentPending && (
                          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2.5">
                            <div className="flex items-center space-x-2 text-blue-900 font-bold">
                              <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                              <span>KYC Verification In Progress</span>
                            </div>
                            <p className="text-[11px] text-blue-800/80 leading-relaxed">
                              Our executive team is currently reviewing your government Aadhaar ID and single/couple eligibility. You will receive an instant WhatsApp update once approved.
                            </p>
                            <div className="text-[10px] font-mono text-blue-700 bg-white/70 px-3 py-1.5 rounded-lg border border-blue-100">
                              Estimated Verification SLA: Under 2 Hours
                            </div>
                          </div>
                        )}

                        {/* 4. REJECTED / RESUBMISSION REQUIRED CARD */}
                        {(!p.hasActivePass && !p.hasUsedPass && !p.isPaymentPending && !p.isUnderReview && p.registrationStatus !== 'PAYMENT_PENDING' && p.registrationStatus !== 'APPROVED' && p.registrationStatus !== 'UNDER_REVIEW' && p.registrationStatus !== 'SUBMITTED') && (
                          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-[#FFF7F7] border-2 border-rose-200 text-xs space-y-3.5 shadow-sm">
                            <div className="flex items-center space-x-2 text-rose-900 font-bold">
                              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                              <span>Document Resubmission Required</span>
                            </div>

                            <div className="text-[#6E5336] text-[11px] bg-white p-3.5 rounded-xl border border-rose-200 space-y-1">
                              <span className="font-bold text-rose-950 block text-[10px] uppercase tracking-wider">
                                Verification Desk Reason:
                              </span>
                              <p className="italic text-rose-900 leading-relaxed">
                                &ldquo;{p.reviewNotes || 'Aadhaar document was not clearly readable or blurry. Please upload a clear original document copy.'}&rdquo;
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-rose-200/60">
                              <p className="text-[11px] text-[#6E5336]">
                                You can upload a clearer document and re-apply immediately:
                              </p>
                              <button
                                onClick={() => {
                                  setIsWalletOpen(false);
                                  handlePassSelect(p.passType || 'SINGLE');
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition shadow-md flex items-center justify-center space-x-1.5 whitespace-nowrap"
                              >
                                <span>Re-Apply / Upload Clear ID →</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 5. USED PASS CARD */}
                        {p.hasUsedPass && (
                          <div className="p-5 rounded-2xl bg-gradient-to-r from-gray-50 to-[#F9F9F9] border-2 border-gray-300 text-xs space-y-3.5 shadow-sm">
                            <div className="flex items-center space-x-2 text-gray-800 font-bold">
                              <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <span>Pass Already Used / Unauthorized</span>
                            </div>

                            <div className="text-[#6E5336] text-[11px] bg-white p-3.5 rounded-xl border border-gray-200 space-y-1">
                              <p className="italic text-gray-700 leading-relaxed">
                                You have already used this QR code / Pass for entry. Re-entry or duplicate usage of the same pass is strictly prohibited and unauthorized.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PAYMENT GATEWAY CHECKOUT MODAL */}
      {/* ========================================================================= */}
      {activePaymentLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-[#EAD9B8] rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative text-center text-[#2D1F0E]">
            <button
              onClick={() => setActivePaymentLink(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F8F5EE] text-[#6E5336] hover:text-[#2D1F0E] flex items-center justify-center border border-[#EAD9B8]"
            >
              ✕
            </button>

            {!paymentSuccessData ? (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFF5DC] border border-[#E5A93C] text-[10px] font-mono tracking-widest font-bold text-[#8C6019] uppercase mb-1">
                    <span>🔒</span>
                    <span>100% SECURE INSTANT CHECKOUT</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">Complete Pass Booking</h3>
                  <p className="text-xs text-[#6E5336] mt-0.5">
                    Authorized KYC review complete. Pay online to mint your unique digital QR pass.
                  </p>
                </div>

                {paymentOrder && (
                  <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-left space-y-3 text-xs text-[#2D1F0E]">
                    <div className="flex justify-between items-center pb-2 border-b border-[#EAD9B8]/70">
                      <div>
                        <span className="text-[#6E5336] block text-[10px] uppercase font-bold tracking-wider">Application</span>
                        <span className="font-mono font-bold text-[#2D1F0E] text-xs">{paymentOrder.registrationNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#6E5336] block text-[10px] uppercase font-bold tracking-wider">Tier</span>
                        <span className="font-bold text-[#D99427] text-xs">{paymentOrder.passType} Pass</span>
                      </div>
                    </div>

                    {/* Approved Attendees Roster */}
                    {paymentOrder.attendees && paymentOrder.attendees.length > 0 && (
                      <div className="space-y-1.5 py-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6019] block">
                          Approved Guest Entitlement ({paymentOrder.attendees.length})
                        </span>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {paymentOrder.attendees.map((att: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-[#EAD9B8] text-[11px]">
                              <span className="font-medium text-[#2D1F0E]">{att.fullName} ({att.gender === 'FEMALE' ? 'F' : 'M'})</span>
                              <span className="font-mono text-[#8C6019] text-[10px]">Aadhaar Verified ✓</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="border-t border-[#EAD9B8] pt-2 space-y-1">
                      <div className="flex justify-between text-[#6E5336] text-[11px]">
                        <span>Event Venue:</span>
                        <span className="font-medium text-[#2D1F0E]">Grand Arena • Rajkot</span>
                      </div>
                      <div className="flex justify-between text-[#6E5336] text-[11px]">
                        <span>Dress Code:</span>
                        <span className="font-bold text-[#D99427]">75% Pure White Required</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-[#EAD9B8]/70">
                        <span className="font-bold text-[#2D1F0E] text-xs uppercase tracking-wider">Total Payable:</span>
                        <span className="text-xl font-serif font-bold text-[#D99427]">
                          ₹{paymentOrder.amountDue?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic UPI QR Container */}
                <div className="p-4 rounded-2xl bg-white border-2 border-[#EAD9B8] inline-block shadow-md">
                  <QRCodeSVG
                    value={`upi://pay?pa=safedsheri@icici&pn=Safed%20Sheri%202026&am=${paymentOrder?.amountDue || 3500}&tn=SS26-${paymentOrder?.registrationNumber || 'PassBooking'}&tr=${paymentOrder?.paymentLinkId || 'UPI'}`}
                    size={140}
                  />
                  <div className="text-[10px] font-mono tracking-wider text-[#8C6019] mt-2 uppercase font-bold">
                    Scan with any UPI App
                  </div>
                  <div className="flex justify-center items-center gap-1.5 mt-1.5 text-[9px] font-semibold text-[#6E5336]">
                    <span className="bg-[#FAF6EE] px-1.5 py-0.5 rounded border border-[#EAD9B8]">GPay</span>
                    <span className="bg-[#FAF6EE] px-1.5 py-0.5 rounded border border-[#EAD9B8]">PhonePe</span>
                    <span className="bg-[#FAF6EE] px-1.5 py-0.5 rounded border border-[#EAD9B8]">Paytm</span>
                    <span className="bg-[#FAF6EE] px-1.5 py-0.5 rounded border border-[#EAD9B8]">BHIM</span>
                    <span className="bg-[#FAF6EE] px-1.5 py-0.5 rounded border border-[#EAD9B8]">Cred</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={paymentLoading}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs tracking-widest uppercase hover:opacity-95 transition disabled:opacity-50 shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
                  >
                    <span>{paymentLoading ? 'Confirming Online Payment...' : `Authorize & Mint Pass (₹${paymentOrder?.amountDue?.toLocaleString() || '3,500'})`}</span>
                  </button>
                  <p className="text-[10px] text-[#6E5336]">
                    Protected by Safed Sheri 256-bit encrypted gateway. Digital QR pass minted instantly.
                  </p>
                </div>
              </div>
            ) : (
              /* PAYMENT CONFIRMED & PASS ISSUED */
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center text-2xl mx-auto font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[#8C6019] uppercase tracking-widest mb-1">
                    ONLINE PAYMENT VERIFIED
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">Pass Successfully Issued!</h3>
                  <p className="text-xs text-[#6E5336] mt-1">
                    Receipt #{paymentSuccessData.receiptNumber} • Transaction #{paymentSuccessData.providerReference}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  Your unique QR entry pass is now live in your <strong>My Pass</strong> wallet.
                </div>

                <button
                  onClick={() => {
                    setActivePaymentLink(null);
                    setIsWalletOpen(true);
                    // Auto-refresh wallet to show the newly minted pass
                    const cleanDigits = walletPhone.replace(/\D/g, '');
                    if (cleanDigits) {
                      setWalletLoading(true);
                      setWalletSearched(true);
                      fetch(`${API_BASE}/credentials/my-pass?query=${encodeURIComponent(cleanDigits)}`)
                        .then(res => res.json())
                        .then(json => { if (json.success && json.data) setWalletPasses(json.data); })
                        .catch(console.error)
                        .finally(() => setWalletLoading(false));
                    }
                  }}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-90 transition shadow-md"
                >
                  View My Pass in Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: GAZEBO INQUIRY MODAL */}
      {/* ========================================================================= */}
      {isGazeboModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-[#EAD9B8] rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative text-[#2D1F0E]">
            <button
              onClick={() => setIsGazeboModalOpen(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F8F5EE] text-[#6E5336] hover:text-[#2D1F0E] flex items-center justify-center border border-[#EAD9B8]"
            >
              ✕
            </button>

            {!gazeboSuccess ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setGazeboError(null);
                  const phoneVal = gazeboForm.phone.replace(/\D/g, '');
                  if (!gazeboForm.fullName || gazeboForm.fullName.trim().length < 2) {
                    setGazeboError('Please enter your full legal name (minimum 2 characters).');
                    return;
                  }
                  if (phoneVal.length !== 10) {
                    setGazeboError('Please enter a valid 10-digit WhatsApp mobile number.');
                    return;
                  }
                  garbaAudio.playDhol();
                  setGazeboLoading(true);
                  try {
                    const res = await fetch(`${API_BASE}/gazebo-inquiries`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...gazeboForm, phone: phoneVal }),
                    });
                    const json = await res.json();
                    if (json.success) {
                      setGazeboSuccess(true);
                      garbaAudio.playGhunghroo();
                    } else {
                      setGazeboError(json.message || json.error?.message || 'Submission failed. Please try again.');
                    }
                  } catch (err: any) {
                    setGazeboError('Network error. Please check your connection and try again.');
                  } finally {
                    setGazeboLoading(false);
                  }
                }}
                className="space-y-5"
              >
                <div>
                  <div className="inline-block text-[10px] font-mono tracking-widest font-bold text-[#8C6019] uppercase mb-1">
                    VIP HOSPITALITY INQUIRY
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">Reserve Gazebo Lounge</h3>
                  <p className="text-xs text-[#6E5336] mt-1">
                    Private viewing lounges for 10–15 guests with dedicated hospitality service. Pricing on request.
                  </p>
                </div>

                {/* Inline Error Banner */}
                {gazeboError && (
                  <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
                    <span>{gazeboError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Host Legal Name *</label>
                    <input
                      type="text"
                      value={gazeboForm.fullName}
                      onChange={(e) => { setGazeboError(null); setGazeboForm({ ...gazeboForm, fullName: e.target.value }); }}
                      placeholder="Full Name (as on ID)"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none transition ${
                        gazeboError && !gazeboForm.fullName.trim() ? 'border-rose-400' : 'border-[#EAD9B8]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">WhatsApp Phone (+91) *</label>
                    <input
                      type="tel"
                      value={gazeboForm.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setGazeboError(null);
                        setGazeboForm({ ...gazeboForm, phone: val });
                      }}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border text-[#2D1F0E] text-xs font-mono focus:border-[#D99427] outline-none transition ${
                        gazeboError && gazeboForm.phone.replace(/\D/g,'').length !== 10 ? 'border-rose-400' : 'border-[#EAD9B8]'
                      }`}
                    />
                    {gazeboForm.phone.length > 0 && (
                      <div className={`text-[10px] mt-1 font-mono ${
                        gazeboForm.phone.replace(/\D/g,'').length === 10 ? 'text-emerald-700' : 'text-[#8C6019]'
                      }`}>
                        {gazeboForm.phone.replace(/\D/g,'').length}/10 digits
                        {gazeboForm.phone.replace(/\D/g,'').length === 10 && ' ✓'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Lounge Spatial Level *</label>
                    <select
                      value={gazeboForm.level}
                      onChange={(e) => setGazeboForm({ ...gazeboForm, level: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none"
                    >
                      <option value={1}>Level 1 — Elevated Amphitheater (₹85,000)</option>
                      <option value={2}>Level 2 — Royal Pavilion (₹1,00,000)</option>
                      <option value={3}>Level 3 — Imperial Sky Lounge (₹1,25,000)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">VIP Concierge Requests</label>
                    <textarea
                      rows={3}
                      value={gazeboForm.notes}
                      onChange={(e) => setGazeboForm({ ...gazeboForm, notes: e.target.value })}
                      placeholder="Guest count, dietary preferences, custom branding, AV requirements..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={gazeboLoading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 transition shadow-lg shadow-[#D99427]/30 disabled:opacity-70 flex items-center justify-center space-x-2"
                >
                  {gazeboLoading ? (
                    <span className="animate-pulse">Submitting Inquiry...</span>
                  ) : (
                    <><Crown className="w-4 h-4" /><span>Submit VIP Gazebo Inquiry</span></>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center text-xl mx-auto font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-serif font-bold text-[#2D1F0E]">Inquiry Received</h3>
                <p className="text-xs text-[#6E5336] max-w-xs mx-auto">
                  Our VIP Concierge Lead will contact you on WhatsApp regarding Gazebo availability & pricing.
                </p>
                <button
                  onClick={() => setIsGazeboModalOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-[#F8F5EE] text-[#2D1F0E] text-xs font-bold uppercase hover:bg-[#F3ECE0] border border-[#EAD9B8] transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 5: OFFICIAL BRAND ALLIANCE & SPONSORSHIP INQUIRY MODAL */}
      {/* ========================================================================= */}
      {isSponsorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-[#FFFDF9] border-2 border-[#EAD9B8] rounded-[2.5rem] w-full max-w-xl p-6 md:p-8 shadow-2xl relative text-[#2D1F0E] my-auto">
            <button
              onClick={() => {
                setIsSponsorModalOpen(false);
                setSponsorSuccess(false);
              }}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F8F5EE] text-[#6E5336] hover:text-[#2D1F0E] flex items-center justify-center border border-[#EAD9B8] transition"
            >
              ✕
            </button>

            {!sponsorSuccess ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  garbaAudio.playDhol();
                  setSponsorLoading(true);
                  try {
                    const res = await fetch(`${API_BASE}/sponsor-inquiries`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(sponsorForm),
                    });
                    const json = await res.json();
                    if (json.success) {
                      setSponsorReference(json.data?.inquiryNumber || 'SPON-2026-CONFIRMED');
                      setSponsorSuccess(true);
                      garbaAudio.playGhunghroo();
                    } else {
                      throw new Error(json.message || 'Submission failed');
                    }
                  } catch (err: any) {
                    alert(err.message || 'Could not submit sponsorship inquiry. Please try again.');
                  } finally {
                    setSponsorLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFF5DC] border border-[#E5A93C] text-[10px] font-mono tracking-widest font-bold text-[#8C6019] uppercase mb-1">
                    <Crown className="w-3.5 h-3.5 text-[#D99427]" />
                    <span>CORPORATE ALLIANCE DESK • RAJKOT</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">Partner With Safed Sheri 2026</h3>
                  <p className="text-xs text-[#6E5336] mt-0.5">
                    Connect your brand with 10,000+ affluent attendees and VIP delegations at Gujarat&apos;s most prestigious Navratri gala.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Company / Brand Name *</label>
                      <input
                        type="text"
                        required
                        value={sponsorForm.companyName}
                        onChange={(e) => setSponsorForm({ ...sponsorForm, companyName: e.target.value })}
                        placeholder="e.g. Reliance Retail / Tanishq"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Authorized Contact Person *</label>
                      <input
                        type="text"
                        required
                        value={sponsorForm.contactName}
                        onChange={(e) => setSponsorForm({ ...sponsorForm, contactName: e.target.value })}
                        placeholder="Full Name & Designation"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">WhatsApp / Mobile (+91) *</label>
                      <input
                        type="tel"
                        required
                        value={sponsorForm.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setSponsorForm({ ...sponsorForm, phone: val });
                        }}
                        placeholder="10-digit mobile number"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Official Work Email *</label>
                      <input
                        type="email"
                        required
                        value={sponsorForm.email}
                        onChange={(e) => setSponsorForm({ ...sponsorForm, email: e.target.value })}
                        placeholder="partnerships@brand.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Partnership Category / Tier *</label>
                    <select
                      value={sponsorForm.sponsorshipType}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, sponsorshipType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none font-medium"
                    >
                      <option value="Title Presenting Partner (Grand Arena Branding)">👑 Title Presenting Partner (Arena Naming & LED Arches)</option>
                      <option value="Powered By Partner (Main Stage & Broadcast)">⭐ Powered By Partner (Main Stage & Broadcast Alliances)</option>
                      <option value="Associate Luxury Sponsor (Acoustic & Fashion)">✨ Associate Luxury Sponsor (Ethnic Fashion / Acoustics / Jewels)</option>
                      <option value="Official Beverage & Hospitality Partner">☕ Official Beverage & Hospitality Partner</option>
                      <option value="VIP Experiential Lounge Activation">🏛️ VIP Cabana Experiential Lounge Activation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] mb-1">Brand Objectives & Activation Notes</label>
                    <textarea
                      rows={3}
                      value={sponsorForm.notes}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, notes: e.target.value })}
                      placeholder="Product sampling, on-ground booth size, VIP passes required, digital display objectives..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sponsorLoading}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 transition shadow-lg shadow-[#D99427]/30 flex items-center justify-center space-x-2"
                  >
                    <span>{sponsorLoading ? 'Submitting Partnership Dossier...' : 'Submit Partnership Inquiry →'}</span>
                  </button>
                  <p className="text-[10px] text-center text-[#6E5336] mt-2">
                    Our Partnership & Alliances Director will contact you within 2-4 business hours on WhatsApp with our official media kit.
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-300 flex items-center justify-center text-2xl mx-auto font-bold shadow-md">
                  ✓
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-widest mb-1">
                    INQUIRY RECORDED • REF: {sponsorReference}
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">Sponsorship Inquiry Received</h3>
                  <p className="text-xs text-[#6E5336] max-w-sm mx-auto mt-1">
                    Thank you for your interest in partnering with <strong>Safed Sheri 2026</strong>. Our Executive Sponsorship Desk has received your dossier and will reach out to <strong>{sponsorForm.phone}</strong> shortly.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-[#6E5336] max-w-sm mx-auto text-left space-y-1">
                  <div className="flex justify-between">
                    <span>Brand Entity:</span>
                    <strong className="text-[#2D1F0E]">{sponsorForm.companyName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Representative:</span>
                    <strong className="text-[#2D1F0E]">{sponsorForm.contactName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected Tier:</span>
                    <strong className="text-[#D99427]">{sponsorForm.sponsorshipType.split('(')[0]}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsSponsorModalOpen(false);
                    setSponsorSuccess(false);
                  }}
                  className="px-8 py-3 rounded-full bg-[#2D1F0E] text-white text-xs font-bold uppercase hover:bg-[#4A351B] transition shadow-md"
                >
                  Close & Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
