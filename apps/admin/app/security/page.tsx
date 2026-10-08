'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, getStoredUser } from '../../lib/api';
import { CheckCircle2, XCircle, RefreshCw, Camera, Lock, Shield, AlertTriangle, Users, Ticket, Crown } from 'lucide-react';
import LogoSlot from '../components/LogoSlot';

export default function SecurityScannerPage() {
  const router = useRouter();
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [html5Scanner, setHtml5Scanner] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const scanningRef = useRef(false);
  const scannerRef = useRef<any>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Selected Gate Terminal State (defaults to GATE_1)
  const [selectedGate, setSelectedGate] = useState<string>('GATE_1');

  // Live Counter & Stats State
  const [liveStats, setLiveStats] = useState<{
    myScansCount: number;
    gateScansCount: number;
    totalAttendeesScanned: number;
    breakdown: {
      couple: number;
      single: number;
      kids: number;
      gazebo: number;
    };
    metrics?: Record<string, { issued: number; scanned: number; remaining: number }>;
    gateBreakdown: Record<string, number>;
  }>({
    myScansCount: 0,
    gateScansCount: 0,
    totalAttendeesScanned: 0,
    breakdown: { couple: 0, single: 0, kids: 0, gazebo: 0 },
    metrics: {
      COUPLE: { issued: 0, scanned: 0, remaining: 0 },
      SINGLE: { issued: 0, scanned: 0, remaining: 0 },
      KIDS: { issued: 0, scanned: 0, remaining: 0 },
      GAZEBO: { issued: 0, scanned: 0, remaining: 0 },
    },
    gateBreakdown: {},
  });

  const [scanResult, setScanResult] = useState<{
    status: 'VALID' | 'NOT_VALID' | null;
    reason?: string;
    message?: string;
    attendeeName?: string;
    passType?: string;
    passCode?: string;
    registrationNumber?: string;
  }>({ status: null });

  const [recentScans, setRecentScans] = useState<any[]>([]);

  // Load User & Assign Gate Based on Credentials
  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    if (!token || !user) {
      setIsAuthenticated(false);
      return;
    }
    setCurrentUser(user);
    setIsAuthenticated(true);

    const uname = (user.username || '').toLowerCase();
    const isMaster = user.role === 'SUPER_ADMIN' || uname === 'masteradmin@safedsheri.com';

    if (!isMaster) {
      if (uname.includes('gate2')) {
        setSelectedGate('GATE_2');
      } else if (uname.includes('gate3')) {
        setSelectedGate('GATE_3');
      } else if (uname.includes('gate4')) {
        setSelectedGate('GATE_4');
      } else {
        setSelectedGate('GATE_1');
      }
    } else {
      const savedGate = localStorage.getItem('safedsheri_selected_gate');
      if (savedGate) {
        setSelectedGate(savedGate);
      }
    }
  }, []);

  // Poll Live Stats every 4 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedGate]);

  async function fetchLiveStats() {
    const res = await apiRequest(`/entries/gate-stats?gateId=${selectedGate}`);
    if (res.success && res.data) {
      setLiveStats(res.data);
    }
  }

  function handleGateChange(gateId: string) {
    setSelectedGate(gateId);
    localStorage.setItem('safedsheri_selected_gate', gateId);
  }

  // Audio tone feedback for gate security
  const playFeedbackSound = (type: 'VALID' | 'NOT_VALID') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'VALID') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const startCamera = async () => {
    if (isCameraStarting) return;
    setIsCameraStarting(true);
    setCameraError(null);
    setIsCameraActive(true);

    try {
      // Allow DOM to render #qr-reader in active state
      await new Promise((r) => setTimeout(r, 80));

      const { Html5Qrcode } = await import('html5-qrcode');

      // Cleanly clear any stale scanner instance
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch (e) {}
        try {
          scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setHtml5Scanner(scanner);

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      const onScanSuccess = (decodedText: string) => {
        if (!scanningRef.current) {
          processScan(decodedText);
        }
      };

      try {
        await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {});
      } catch (envErr) {
        console.warn('Environment camera failed, falling back to user camera', envErr);
        try {
          await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {});
        } catch (userErr) {
          console.warn('User camera failed, enumerating system cameras', userErr);
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const backCam = cameras.find((c: any) =>
              c.label?.toLowerCase().includes('back') ||
              c.label?.toLowerCase().includes('rear') ||
              c.label?.toLowerCase().includes('environment')
            ) || cameras[cameras.length - 1];

            await scanner.start(backCam.id, config, onScanSuccess, () => {});
          } else {
            throw userErr;
          }
        }
      }
    } catch (err: any) {
      console.error('Camera activation failed:', err);
      setCameraError(err?.message || 'Could not access camera. Please check browser camera permissions.');
      setIsCameraActive(false);
    } finally {
      setIsCameraStarting(false);
    }
  };

  const stopCamera = async () => {
    setIsCameraStarting(false);
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.warn('Error while stopping scanner:', e);
      }
      try {
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const pauseScanner = () => {
    if (scannerRef.current) {
      try {
        if (typeof scannerRef.current.pause === 'function') {
          scannerRef.current.pause(true);
        }
      } catch (e) {
        console.warn('Scanner pause failed:', e);
      }
    }
  };

  const resumeScanner = async () => {
    let resumed = false;
    if (scannerRef.current) {
      try {
        if (typeof scannerRef.current.resume === 'function') {
          scannerRef.current.resume();
          resumed = true;
        }
      } catch (e) {
        console.warn('Scanner resume failed:', e);
      }
    }
    if (!resumed && (!isCameraActive || !scannerRef.current)) {
      await startCamera();
    }
  };

  const handleNextScan = async () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setScanResult({ status: null });
    scanningRef.current = false;
    setScanning(false);
    await resumeScanner();
  };

  const dismissResult = () => {
    handleNextScan();
  };

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            try { scannerRef.current.clear(); } catch (e) {}
          });
        } else {
          try { scannerRef.current.clear(); } catch (e) {}
        }
      }
    };
  }, []);

  async function processScan(token: string) {
    if (!token || scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    const res = await apiRequest('/entries/scan', {
      method: 'POST',
      body: JSON.stringify({ token: token.trim(), gateId: selectedGate }),
    });

    if (res.success && res.data) {
      setScanResult(res.data);
      pauseScanner();
      playFeedbackSound(res.data.status === 'VALID' ? 'VALID' : 'NOT_VALID');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (res.data.status === 'VALID') {
          try { navigator.vibrate([150, 70, 150]); } catch (e) {}
        } else {
          try { navigator.vibrate([300, 100, 300]); } catch (e) {}
        }
      }

      setRecentScans((prev) => [
        {
          token,
          gateId: selectedGate,
          status: res.data.status,
          reason: res.data.reason,
          message: res.data.message,
          name: res.data.attendeeName,
          passType: res.data.passType,
          passCode: res.data.passCode,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 7),
      ]);

      fetchLiveStats();
      // Result remains until the user clicks 'Next'
    } else {
      if (res.error?.code === 'UNAUTHORIZED' || res.error?.statusCode === 401) {
        setIsAuthenticated(false);
        return;
      }
      setScanResult({
        status: 'NOT_VALID',
        reason: res.error?.message || 'INVALID_TOKEN',
      });
      pauseScanner();
      playFeedbackSound('NOT_VALID');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([300, 100, 300]); } catch (e) {}
      }
      // Result remains until the user clicks 'Next'
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode('qr-reader');
          setHtml5Scanner(scannerRef.current);
        }
        const decodedText = await scannerRef.current.scanFile(e.target.files[0], true);
        processScan(decodedText);
      } catch (err) {
        console.error("Failed to decode QR from image", err);
        alert("Could not find a valid QR code in this image.");
      }
    }
  };

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    processScan(manualToken);
    setManualToken('');
  }

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.username === 'masteradmin@safedsheri.com';

  const gateDescriptions: Record<string, { title: string; subtitle: string; categoryKey: string; label: string }> = {
    GATE_1: { title: 'GATE 1 TERMINAL', subtitle: 'COUPLE PASS SCANNER ONLY', categoryKey: 'COUPLE', label: 'COUPLE PASSES' },
    GATE_2: { title: 'GATE 2 TERMINAL', subtitle: 'FEMALE / SINGLE PASS SCANNER ONLY', categoryKey: 'SINGLE', label: 'FEMALE / SINGLE PASSES' },
    GATE_3: { title: 'GATE 3 TERMINAL', subtitle: 'KIDS PASS SCANNER ONLY', categoryKey: 'KIDS', label: 'KIDS PASSES' },
    GATE_4: { title: 'GATE 4 TERMINAL', subtitle: 'GAZEBO VIP PASS SCANNER ONLY', categoryKey: 'GAZEBO', label: 'GAZEBO VIP PASSES' },
    MASTER_ADMIN: { title: 'MASTER ADMIN TERMINAL', subtitle: 'ALL PASS CATEGORIES PERMITTED', categoryKey: 'ALL', label: 'ALL PASSES' },
  };

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-white text-[#2D1F0E] flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-white border-2 border-[#EAD9B8] rounded-3xl p-8 shadow-xl text-center space-y-5">
          <LogoSlot className="justify-center mx-auto" />
          <div className="w-16 h-16 rounded-full bg-[#FFF5DC] border border-[#E5A93C] flex items-center justify-center mx-auto text-[#8C6019]">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-[#2D1F0E]">GATE TERMINAL LOGIN REQUIRED</h2>
            <p className="text-xs text-[#6E5336] mt-2">
              Sign in with Entry Verification credentials to scan attendee QR passes.
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

  const gateInfo = gateDescriptions[selectedGate] || { title: selectedGate, subtitle: 'PASS SCANNER', categoryKey: 'COUPLE', label: 'COUPLE PASSES' };
  const currentCategoryMetrics = liveStats.metrics?.[gateInfo.categoryKey] || { issued: 0, scanned: 0, remaining: 0 };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-[#2D1F0E] pb-12 px-4">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-1">
          <LogoSlot size="md" />
        </div>
        <span className="text-[10px] font-mono tracking-[0.25em] font-bold text-[#8C6019] uppercase">
          OCTOBER 9TH GATE ACCESS SYSTEM
        </span>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F0E]">Security Gate Pass Scanner</h1>
        <p className="text-xs text-[#6E5336]">
          {isSuperAdmin
            ? 'Master Admin Control Terminal: Switch active gate below to simulate or scan any pass.'
            : `${gateInfo.title} • ${gateInfo.subtitle}`}
        </p>
      </div>

      {/* GATE TERMINAL HEADER / SELECTOR */}
      {isSuperAdmin ? (
        <div className="p-4 rounded-3xl bg-white border-2 border-[#EAD9B8] shadow-md space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C6019] flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-[#D99427]" /> Master Admin Gate Terminal Selector:
            </span>
            <span className="text-[11px] font-mono font-bold bg-[#FFF5DC] text-[#8C6019] px-2.5 py-0.5 rounded-full border border-[#E5A93C]">
              ACTIVE: {selectedGate.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleGateChange('GATE_1')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                selectedGate === 'GATE_1'
                  ? 'bg-gradient-to-br from-[#2D1F0E] to-[#4A351D] text-[#F6C85F] border-[#D99427] shadow-lg scale-[1.02]'
                  : 'bg-[#FAF6EE] text-[#2D1F0E] border-[#EAD9B8] hover:bg-[#F5ECCB]'
              }`}
            >
              <div className="text-[10px] font-bold uppercase opacity-80">GATE 1</div>
              <div className="text-xs font-bold font-serif mt-1">COUPLE PASS</div>
              <div className="text-[9px] opacity-70 mt-1 font-mono">Couple Only</div>
            </button>

            <button
              type="button"
              onClick={() => handleGateChange('GATE_2')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                selectedGate === 'GATE_2'
                  ? 'bg-gradient-to-br from-[#2D1F0E] to-[#4A351D] text-[#F6C85F] border-[#D99427] shadow-lg scale-[1.02]'
                  : 'bg-[#FAF6EE] text-[#2D1F0E] border-[#EAD9B8] hover:bg-[#F5ECCB]'
              }`}
            >
              <div className="text-[10px] font-bold uppercase opacity-80">GATE 2</div>
              <div className="text-xs font-bold font-serif mt-1">FEMALE / SINGLE</div>
              <div className="text-[9px] opacity-70 mt-1 font-mono">Single Only</div>
            </button>

            <button
              type="button"
              onClick={() => handleGateChange('GATE_3')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                selectedGate === 'GATE_3'
                  ? 'bg-gradient-to-br from-[#2D1F0E] to-[#4A351D] text-[#F6C85F] border-[#D99427] shadow-lg scale-[1.02]'
                  : 'bg-[#FAF6EE] text-[#2D1F0E] border-[#EAD9B8] hover:bg-[#F5ECCB]'
              }`}
            >
              <div className="text-[10px] font-bold uppercase opacity-80">GATE 3</div>
              <div className="text-xs font-bold font-serif mt-1">KIDS PASS</div>
              <div className="text-[9px] opacity-70 mt-1 font-mono">Kids Only</div>
            </button>

            <button
              type="button"
              onClick={() => handleGateChange('GATE_4')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                selectedGate === 'GATE_4'
                  ? 'bg-gradient-to-br from-[#2D1F0E] to-[#4A351D] text-[#F6C85F] border-[#D99427] shadow-lg scale-[1.02]'
                  : 'bg-[#FAF6EE] text-[#2D1F0E] border-[#EAD9B8] hover:bg-[#F5ECCB]'
              }`}
            >
              <div className="text-[10px] font-bold uppercase opacity-80">GATE 4</div>
              <div className="text-xs font-bold font-serif mt-1">GAZEBO PASS</div>
              <div className="text-[9px] opacity-70 mt-1 font-mono">Gazebo VIP</div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleGateChange('MASTER_ADMIN')}
            className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition ${
              selectedGate === 'MASTER_ADMIN'
                ? 'bg-amber-500 text-black border-amber-600 shadow-md font-extrabold'
                : 'bg-[#FFF5DC] text-[#8C6019] border-[#E5A93C] hover:bg-[#FCEBB8]'
            }`}
          >
            <Crown className="w-4 h-4 text-[#8C6019]" />
            Master Admin Mode (Scans ALL Passes Without Restriction)
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#2D1F0E] to-[#4A351D] text-[#F6C85F] border-2 border-[#D99427] shadow-lg text-center space-y-1">
          <div className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#EAD9B8]">
            ASSIGNED GATE TERMINAL
          </div>
          <div className="text-xl font-serif font-extrabold text-[#F6C85F]">
            {gateInfo.title}
          </div>
          <div className="text-xs font-mono font-bold text-white bg-black/30 inline-block px-3 py-1 rounded-full border border-white/10 mt-1">
            {gateInfo.subtitle}
          </div>
        </div>
      )}

      {/* LIVE COUNTERS BANNER */}
      {!isSuperAdmin ? (
        /* STRICT SINGLE GATE OPERATOR VIEW: Shows ONLY 4 Cards Relevant to THIS Specific Gate! */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3.5 bg-white border border-[#EAD9B8] rounded-2xl shadow-sm space-y-0.5">
            <div className="text-[10px] font-mono uppercase font-bold text-[#8C6019]">MY GATE SCANS</div>
            <div className="text-2xl font-bold font-serif text-[#2D1F0E]">{liveStats.myScansCount}</div>
            <div className="text-[9px] text-[#6E5336]">Scans Completed</div>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm space-y-0.5">
            <div className="text-[10px] font-mono uppercase font-bold text-blue-900">TOTAL ISSUED</div>
            <div className="text-2xl font-bold font-serif text-blue-950">{currentCategoryMetrics.issued}</div>
            <div className="text-[9px] text-blue-800">{gateInfo.label}</div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-0.5">
            <div className="text-[10px] font-mono uppercase font-bold text-emerald-900">SCANNED (INSIDE)</div>
            <div className="text-2xl font-bold font-serif text-emerald-950">{currentCategoryMetrics.scanned}</div>
            <div className="text-[9px] text-emerald-800">Entered Venue</div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl shadow-sm space-y-0.5">
            <div className="text-[10px] font-mono uppercase font-bold text-amber-900">REMAINING (LEFT)</div>
            <div className="text-2xl font-bold font-serif text-amber-950">{currentCategoryMetrics.remaining}</div>
            <div className="text-[9px] text-amber-800">Left to Enter</div>
          </div>
        </div>
      ) : (
        /* MASTER ADMIN VIEW: Shows Full Event Overview Breakdown Across All Pass Categories */
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8C6019] flex items-center justify-between px-1">
            <span>MASTER ADMIN LIVE ATTENDANCE DASHBOARD</span>
            <span className="text-[10px] font-mono font-bold bg-[#FFF5DC] px-2 py-0.5 rounded border border-[#E5A93C]">
              TOTAL INSIDE: {liveStats.totalAttendeesScanned}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {/* COUPLE */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase text-emerald-900">COUPLE PASSES</div>
              <div className="text-xs text-emerald-950 space-x-1 font-mono">
                <span>Issued: <strong>{liveStats.metrics?.COUPLE?.issued || 0}</strong></span> • 
                <span>In: <strong className="text-emerald-700">{liveStats.metrics?.COUPLE?.scanned || 0}</strong></span>
              </div>
              <div className="text-[11px] font-bold text-emerald-800 bg-white/70 rounded py-0.5 border border-emerald-200">
                Left: {liveStats.metrics?.COUPLE?.remaining || 0}
              </div>
            </div>

            {/* FEMALE / SINGLE */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase text-blue-900">FEMALE / SINGLE</div>
              <div className="text-xs text-blue-950 space-x-1 font-mono">
                <span>Issued: <strong>{liveStats.metrics?.SINGLE?.issued || 0}</strong></span> • 
                <span>In: <strong className="text-blue-700">{liveStats.metrics?.SINGLE?.scanned || 0}</strong></span>
              </div>
              <div className="text-[11px] font-bold text-blue-800 bg-white/70 rounded py-0.5 border border-blue-200">
                Left: {liveStats.metrics?.SINGLE?.remaining || 0}
              </div>
            </div>

            {/* KIDS */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase text-purple-900">KIDS PASSES</div>
              <div className="text-xs text-purple-950 space-x-1 font-mono">
                <span>Issued: <strong>{liveStats.metrics?.KIDS?.issued || 0}</strong></span> • 
                <span>In: <strong className="text-purple-700">{liveStats.metrics?.KIDS?.scanned || 0}</strong></span>
              </div>
              <div className="text-[11px] font-bold text-purple-800 bg-white/70 rounded py-0.5 border border-purple-200">
                Left: {liveStats.metrics?.KIDS?.remaining || 0}
              </div>
            </div>

            {/* GAZEBO */}
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase text-amber-900">GAZEBO VIP</div>
              <div className="text-xs text-amber-950 space-x-1 font-mono">
                <span>Issued: <strong>{liveStats.metrics?.GAZEBO?.issued || 0}</strong></span> • 
                <span>In: <strong className="text-amber-700">{liveStats.metrics?.GAZEBO?.scanned || 0}</strong></span>
              </div>
              <div className="text-[11px] font-bold text-amber-800 bg-white/70 rounded py-0.5 border border-amber-200">
                Left: {liveStats.metrics?.GAZEBO?.remaining || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCANNER CAMERA BOX & INPUT */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#EAD9B8] shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[#8C6019]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D1F0E]">
              Pass Scanner Camera
            </span>
          </div>
          {/* CAMERA ON / OFF BUTTON */}
          <button
            type="button"
            onClick={isCameraActive ? stopCamera : startCamera}
            disabled={isCameraStarting}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-2 transition shadow-sm ${
              isCameraActive
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>
              {isCameraStarting
                ? 'Connecting...'
                : isCameraActive
                ? 'Turn Scanner OFF'
                : 'Turn Scanner ON'}
            </span>
          </button>
        </div>

        {/* SCANNER VIEWPORT WITH STABLE CONTAINER TO PREVENT ANY JUMP */}
        <div className="relative w-full min-h-[300px] sm:min-h-[360px] overflow-hidden rounded-2xl border-2 border-[#EAD9B8] bg-[#FFFDF9] flex flex-col justify-center items-center shadow-inner">
          {/* HTML5 QR READER TARGET - Kept in DOM with proper dimensions */}
          <div
            id="qr-reader"
            className="w-full"
            style={{ width: '100%', minHeight: '280px' }}
          />

          {/* STANDBY STATE WHEN CAMERA IS OFF */}
          {!isCameraActive && !isCameraStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#FAF6EE] z-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FFF5DC] border-2 border-[#E5A93C] flex items-center justify-center text-[#8C6019] shadow-sm">
                <Camera className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="text-base font-bold font-serif text-[#2D1F0E]">
                  Scanner is Paused
                </div>
                <p className="text-xs text-[#6E5336] max-w-xs leading-relaxed">
                  Tap below to turn on the camera and scan attendee QR passes for {selectedGate.replace('_', ' ')}.
                </p>
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2D1F0E] to-[#4A351D] text-[#F6C85F] font-bold text-xs uppercase tracking-wider shadow-md border border-[#D99427] hover:opacity-95 transition flex items-center space-x-2"
              >
                <Camera className="w-4 h-4 text-[#F6C85F]" />
                <span>Turn Scanner ON</span>
              </button>
            </div>
          )}

          {/* CONNECTING / STARTING SPINNER */}
          {isCameraStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/75 backdrop-blur-xs text-white z-20 space-y-3">
              <div className="w-10 h-10 border-4 border-[#F6C85F] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#F6C85F]">
                Accessing Camera...
              </span>
            </div>
          )}

          {/* CAMERA ERROR OVERLAY */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#FAF6EE] z-20 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-red-900 leading-tight max-w-xs">{cameraError}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-white border border-[#EAD9B8] text-xs font-bold text-[#2D1F0E] rounded-xl"
                >
                  Retry Camera
                </button>
                <label className="px-4 py-2 bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md">
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {/* SCANNER OVERLAY: ENTRY GRANTED / DENIED DIRECTLY ON TOP OF SCANNER */}
          {scanResult.status && (
            <div
              onClick={handleNextScan}
              className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 animate-scale-up backdrop-blur-md ${
                scanResult.status === 'VALID'
                  ? 'bg-emerald-950/95 text-white border-4 border-emerald-400'
                  : scanResult.reason === 'WRONG_GATE'
                  ? 'bg-amber-950/95 text-white border-4 border-amber-400'
                  : 'bg-rose-950/95 text-white border-4 border-rose-500'
              }`}
            >
              <div className="flex justify-center mb-2">
                {scanResult.status === 'VALID' ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-pulse drop-shadow-lg" />
                ) : scanResult.reason === 'WRONG_GATE' ? (
                  <AlertTriangle className="w-16 h-16 text-amber-400 animate-bounce drop-shadow-lg" />
                ) : (
                  <XCircle className="w-16 h-16 text-rose-400 animate-pulse drop-shadow-lg" />
                )}
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-serif font-black tracking-wide uppercase drop-shadow">
                  {scanResult.status === 'VALID'
                    ? 'ENTRY GRANTED'
                    : scanResult.reason === 'WRONG_GATE'
                    ? 'WRONG GATE PASS'
                    : 'ENTRY DENIED'}
                </div>
                <div className="text-xs sm:text-sm font-mono font-bold tracking-wide opacity-90 max-w-xs">
                  {scanResult.status === 'VALID'
                    ? `Welcome to Safed Sheri 2026 (${selectedGate.replace('_', ' ')})`
                    : scanResult.message || `Reason: ${scanResult.reason || 'INVALID_TOKEN'}`}
                </div>
              </div>

              {scanResult.attendeeName && (
                <div className="mt-3 pt-3 border-t border-white/20 text-xs space-y-1 w-full max-w-xs bg-black/20 p-3 rounded-2xl">
                  <div className="font-bold text-base sm:text-lg text-white drop-shadow">
                    {scanResult.attendeeName}
                  </div>
                  <div className="font-mono text-xs text-amber-300 font-bold">
                    {scanResult.passType} PASS • {scanResult.passCode}
                  </div>
                </div>
              )}

              {/* DEDICATED NEXT BUTTON */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextScan();
                }}
                className="mt-5 w-full max-w-xs py-3.5 px-6 rounded-2xl bg-white text-[#2D1F0E] font-black text-sm uppercase tracking-wider shadow-2xl flex items-center justify-center space-x-2 hover:bg-amber-50 active:scale-95 transition-all border-2 border-white/80 cursor-pointer"
              >
                <span>Click Next To Scan Another Pass</span>
                <span className="text-base font-bold">➔</span>
              </button>
            </div>
          )}
        </div>

        {/* MANUAL ENTRY FORM */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <label className="block text-xs font-bold text-[#6E5336]">
            Manual QR Token or Pass Code Entry ({selectedGate.replace('_', ' ')})
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. ss_qr_... or SS26-SINGLE-XXXX"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs font-mono focus:border-[#D99427] outline-none"
            />
            <button
              type="submit"
              disabled={scanning}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition disabled:opacity-50 shadow-md whitespace-nowrap"
            >
              {scanning ? 'Verifying...' : 'Verify Entry'}
            </button>
          </div>
        </form>

        <style jsx global>{`
          #qr-reader {
            border: none !important;
            width: 100% !important;
          }
          #qr-reader video {
            width: 100% !important;
            max-height: 420px !important;
            object-fit: cover !important;
            border-radius: 1rem !important;
          }
          #qr-reader__scan_region {
            border-radius: 1rem !important;
          }
          #qr-reader__scan_region img {
            display: none !important;
          }
          #qr-reader__dashboard {
            display: none !important;
          }
        `}</style>
      </div>

      {/* RECENT SCANS LOG */}
      {recentScans.length > 0 && (
        <div className="p-5 rounded-3xl bg-white border border-[#EAD9B8] shadow-sm space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8C6019]">
            Recent Terminal Gate Scans
          </div>
          <div className="divide-y divide-[#EAD9B8] text-xs">
            {recentScans.map((s, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-[#2D1F0E]">{s.name || s.token.slice(0, 16)}</div>
                  <div className="text-[10px] font-mono text-[#6E5336]">
                    {s.passType || 'PASS'} • {s.passCode || s.time} • <span className="font-bold text-[#8C6019]">{s.gateId}</span>
                  </div>
                </div>
                <div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === 'VALID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.reason === 'WRONG_GATE'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {s.status === 'VALID' ? 'VALID' : s.reason || 'REJECTED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
