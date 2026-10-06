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
  const scanningRef = useRef(false);

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
    gateBreakdown: Record<string, number>;
  }>({
    myScansCount: 0,
    gateScansCount: 0,
    totalAttendeesScanned: 0,
    breakdown: { couple: 0, single: 0, kids: 0, gazebo: 0 },
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

  useEffect(() => {
    if (isAuthenticated !== true) return;
    let isMounted = true;
    let scanner: any;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        scanner = new Html5Qrcode('qr-reader');
        if (isMounted) setHtml5Scanner(scanner);

        const onScanSuccess = (decodedText: string) => {
          if (!scanningRef.current) {
            processScan(decodedText);
          }
        };

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        try {
          if (isMounted) {
            await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {});
          }
        } catch (err) {
          console.warn('Environment camera failed, falling back to user camera', err);
          if (isMounted) {
            try {
              await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {});
            } catch (fallbackErr) {
              console.error('All camera attempts failed:', fallbackErr);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize scanner library:', err);
      }
    };

    const timer = setTimeout(() => {
      initScanner();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().then(() => {
            try { scanner.clear(); } catch (e) {}
          }).catch(console.error);
        } else {
          try { scanner.clear(); } catch (e) {}
        }
      }
    };
  }, [isAuthenticated]);

  async function processScan(token: string) {
    if (!token || scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);

    const res = await apiRequest('/entries/scan', {
      method: 'POST',
      body: JSON.stringify({ token: token.trim(), gateId: selectedGate }),
    });

    if (res.success && res.data) {
      setScanResult(res.data);

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

      setTimeout(() => {
        setScanResult({ status: null });
        scanningRef.current = false;
        setScanning(false);
      }, 3500);
    } else {
      if (res.error?.code === 'UNAUTHORIZED') {
        setIsAuthenticated(false);
        return;
      }
      setScanResult({
        status: 'NOT_VALID',
        reason: res.error?.message || 'INVALID_TOKEN',
      });
      setTimeout(() => {
        setScanResult({ status: null });
        scanningRef.current = false;
        setScanning(false);
      }, 3500);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && html5Scanner) {
      try {
        const decodedText = await html5Scanner.scanFile(e.target.files[0], true);
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

  const gateDescriptions: Record<string, { title: string; subtitle: string }> = {
    GATE_1: { title: 'GATE 1 TERMINAL', subtitle: 'COUPLE PASS SCANNER ONLY' },
    GATE_2: { title: 'GATE 2 TERMINAL', subtitle: 'FEMALE / SINGLE PASS SCANNER ONLY' },
    GATE_3: { title: 'GATE 3 TERMINAL', subtitle: 'KIDS PASS SCANNER ONLY' },
    GATE_4: { title: 'GATE 4 TERMINAL', subtitle: 'GAZEBO VIP PASS SCANNER ONLY' },
    MASTER_ADMIN: { title: 'MASTER ADMIN TERMINAL', subtitle: 'ALL PASS CATEGORIES PERMITTED' },
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

  const gateInfo = gateDescriptions[selectedGate] || { title: selectedGate, subtitle: 'PASS SCANNER' };

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
            ? 'Master Admin Terminal: Select active gate below to simulate or override scanner controls.'
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

      {/* LIVE COUNTERS & EVENT BREAKDOWN BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        <div className="p-3 bg-white border border-[#EAD9B8] rounded-2xl shadow-sm space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-[#8C6019]">MY SCANS</div>
          <div className="text-xl font-bold text-[#2D1F0E]">{liveStats.myScansCount}</div>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-emerald-800">COUPLE</div>
          <div className="text-xl font-bold text-emerald-950">{liveStats.breakdown.couple}</div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-blue-800">FEMALE / SINGLE</div>
          <div className="text-xl font-bold text-blue-950">{liveStats.breakdown.single}</div>
        </div>

        <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl shadow-sm space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-purple-800">KIDS</div>
          <div className="text-xl font-bold text-purple-950">{liveStats.breakdown.kids}</div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl shadow-sm space-y-0.5 col-span-2 sm:col-span-1">
          <div className="text-[10px] font-mono uppercase text-amber-900 font-bold">TOTAL INSIDE</div>
          <div className="text-xl font-bold text-amber-950">{liveStats.totalAttendeesScanned}</div>
        </div>
      </div>

      {/* SCAN RESULT OVERLAY BANNER */}
      {scanResult.status && (
        <div
          className={`p-6 rounded-3xl border-2 text-center space-y-3 shadow-xl transition animate-scale-up ${
            scanResult.status === 'VALID'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
              : scanResult.reason === 'WRONG_GATE'
              ? 'bg-amber-50 border-amber-400 text-amber-950'
              : 'bg-red-50 border-red-400 text-red-950'
          }`}
        >
          <div className="flex justify-center">
            {scanResult.status === 'VALID' ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-pulse" />
            ) : scanResult.reason === 'WRONG_GATE' ? (
              <AlertTriangle className="w-16 h-16 text-amber-600 animate-bounce" />
            ) : (
              <XCircle className="w-16 h-16 text-red-600 animate-pulse" />
            )}
          </div>

          <div>
            <div className="text-2xl font-serif font-extrabold tracking-wide">
              {scanResult.status === 'VALID'
                ? 'ENTRY GRANTED'
                : scanResult.reason === 'WRONG_GATE'
                ? 'WRONG GATE PASS'
                : 'ENTRY DENIED'}
            </div>
            <div className="text-xs font-mono mt-1 font-bold">
              {scanResult.status === 'VALID'
                ? `Welcome to Safed Sheri 2026 (${selectedGate.replace('_', ' ')})`
                : scanResult.message || `Reason: ${scanResult.reason || 'INVALID_TOKEN'}`}
            </div>
          </div>

          {scanResult.attendeeName && (
            <div className="pt-2 border-t border-black/10 text-xs space-y-1">
              <div className="font-bold text-sm text-[#2D1F0E]">{scanResult.attendeeName}</div>
              <div className="font-mono text-[11px] text-[#8C6019] font-bold">
                {scanResult.passType} PASS • {scanResult.passCode}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCANNER CAMERA SIMULATOR / INPUT */}
      <div className="p-6 rounded-3xl bg-white border border-[#EAD9B8] shadow-lg space-y-5">
        <div className="relative w-full min-h-[250px] overflow-hidden rounded-2xl border-2 border-dashed border-[#EAD9B8] bg-[#FFFDF9] flex items-center justify-center">
          <div id="qr-reader" className="w-full"></div>
          
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#FFFDF9] z-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-red-900 leading-tight">{cameraError}</p>
              
              <label className="mt-4 px-6 py-3 bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md hover:opacity-90">
                Upload QR Image Instead
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>

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
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition disabled:opacity-50 shadow-md"
            >
              {scanning ? 'Verifying...' : 'Verify Entry'}
            </button>
          </div>
        </form>
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
