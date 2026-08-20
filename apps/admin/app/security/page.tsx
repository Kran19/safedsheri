'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, getStoredUser } from '../../lib/api';
import { CheckCircle2, XCircle, RefreshCw, Camera, Keyboard, Lock, Shield } from 'lucide-react';
import { useRef } from 'react';
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
  const [scanResult, setScanResult] = useState<{
    status: 'VALID' | 'NOT_VALID' | null;
    reason?: string;
    attendeeName?: string;
    passType?: string;
    passCode?: string;
    registrationNumber?: string;
  }>({ status: null });

  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    if (!token || !user) {
      setIsAuthenticated(false);
      return;
    }
    setIsAuthenticated(true);
  }, []);

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

    // Add a small delay to ensure DOM is fully painted and stable
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
    if (!token || scanning) return;
    setScanning(true);

    const res = await apiRequest('/entries/scan', {
      method: 'POST',
      body: JSON.stringify({ token: token.trim() }),
    });

    setScanning(false);

    if (res.success && res.data) {
      setScanResult(res.data);

      setRecentScans((prev) => [
        {
          token,
          status: res.data.status,
          reason: res.data.reason,
          name: res.data.attendeeName,
          passType: res.data.passType,
          passCode: res.data.passCode,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 5),
      ]);

      setTimeout(() => {
        setScanResult({ status: null });
      }, 2500);
    } else {
      if (res.error?.code === 'UNAUTHORIZED') {
        setIsAuthenticated(false);
        return;
      }
      setScanResult({
        status: 'NOT_VALID',
        reason: 'INVALID_TOKEN',
      });
      setTimeout(() => {
        setScanResult({ status: null });
      }, 2500);
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

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in text-[#2D1F0E] pb-12">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-1">
          <LogoSlot size="md" />
        </div>
        <span className="text-[10px] font-mono tracking-[0.25em] font-bold text-[#8C6019] uppercase">
          GATE ACCESS CONTROL
        </span>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F0E]">Security Pass Scanner</h1>
        <p className="text-xs text-[#6E5336]">
          Scan guest QR codes or enter visible pass code to validate entry.
        </p>
      </div>

      {/* SCAN RESULT OVERLAY BANNER */}
      {scanResult.status && (
        <div
          className={`p-6 rounded-3xl border-2 text-center space-y-3 shadow-xl transition animate-scale-up ${
            scanResult.status === 'VALID'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
              : 'bg-red-50 border-red-400 text-red-950'
          }`}
        >
          <div className="flex justify-center">
            {scanResult.status === 'VALID' ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-pulse" />
            ) : (
              <XCircle className="w-16 h-16 text-red-600 animate-pulse" />
            )}
          </div>

          <div>
            <div className="text-2xl font-serif font-extrabold tracking-wide">
              {scanResult.status === 'VALID' ? 'ENTRY GRANTED' : 'ENTRY DENIED'}
            </div>
            <div className="text-xs font-mono mt-1 font-bold">
              {scanResult.status === 'VALID'
                ? `Welcome to Safed Sheri 2026`
                : `Reason: ${scanResult.reason || 'INVALID_TOKEN'}`}
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
            Manual QR Token or Pass Code Entry
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
            Recent Gate Scans
          </div>
          <div className="divide-y divide-[#EAD9B8] text-xs">
            {recentScans.map((s, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-[#2D1F0E]">{s.name || s.token.slice(0, 16)}</div>
                  <div className="text-[10px] font-mono text-[#6E5336]">{s.passCode || s.time}</div>
                </div>
                <div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === 'VALID'
                        ? 'bg-emerald-100 text-emerald-800'
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
