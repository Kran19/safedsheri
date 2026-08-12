'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAuthToken, getStoredUser } from '../../lib/api';
import { CheckCircle2, XCircle, RefreshCw, Camera, Keyboard, Lock } from 'lucide-react';
import LogoSlot from '../components/LogoSlot';

export default function SecurityScannerPage() {
  const router = useRouter();
  const [manualToken, setManualToken] = useState('ss_qr_demo_ready_02');
  const [scanning, setScanning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<{
    status: 'VALID' | 'NOT_VALID' | null;
    reason?: string;
    attendeeName?: string;
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
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 4),
      ]);

      setTimeout(() => {
        setScanResult({ status: null });
      }, 1800);
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
      }, 1800);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    processScan(manualToken);
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
            <h2 className="text-xl font-bold font-cinzel text-[#1C160F]">SECURITY GATE TERMINAL LOGIN REQUIRED</h2>
            <p className="text-xs text-slate-600 mt-2">
              You must sign in with Entry Verification / Security credentials to scan visitor passes.
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
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2319] p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <LogoSlot className="justify-center mx-auto mb-2" />
          <span className="text-xs font-mono uppercase tracking-widest text-amber-800 font-bold block">GATE SCANNER TERMINAL</span>
          <h2 className="text-2xl font-bold text-[#1C160F] font-cinzel">Safed Sheri Gate Verification</h2>
        </div>

        {/* Visual Result Overlay Banners */}
        {scanResult.status === 'VALID' && (
          <div className="bg-emerald-500 text-slate-950 p-8 rounded-3xl text-center space-y-3 shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight">VALID</h2>
            {scanResult.attendeeName && (
              <p className="text-xl font-bold text-slate-950 mt-1">{scanResult.attendeeName}</p>
            )}
            {scanResult.registrationNumber && (
              <p className="text-xs font-mono font-semibold tracking-wider opacity-80">{scanResult.registrationNumber}</p>
            )}
            <p className="text-xs font-semibold uppercase tracking-widest pt-2 opacity-85">ENTRY GRANTED • RE-ARMING...</p>
          </div>
        )}

        {scanResult.status === 'NOT_VALID' && (
          <div className="bg-rose-600 text-white p-8 rounded-3xl text-center space-y-3 shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-white text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight">NOT VALID</h2>
            <p className="text-xl font-bold uppercase tracking-wide text-rose-100">
              {scanResult.reason?.replace('_', ' ') || 'INVALID QR'}
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest pt-2 opacity-85">ACCESS DENIED • RE-ARMING...</p>
          </div>
        )}

        {/* Main Camera / Scanner Box */}
        {scanResult.status === null && (
          <div className="bg-white border-2 border-amber-400/40 rounded-3xl p-6 text-center space-y-5 shadow-xl relative overflow-hidden">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto border border-amber-300">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-cinzel text-lg font-bold text-[#1C160F]">READY TO SCAN</h3>
              <p className="text-xs text-slate-600 mt-1">Point QR code at camera or enter token code below</p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
              <div className="relative">
                <Keyboard className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Enter QR Secure Token"
                  className="w-full bg-[#FAF7F2] border border-amber-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-mono text-[#1C160F] focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50"
              >
                {scanning ? 'Validating Token...' : 'Simulate QR Scan'}
              </button>
            </form>
          </div>
        )}

        {/* Recent Scan Audit Log */}
        {recentScans.length > 0 && (
          <div className="bg-white border border-amber-300/40 rounded-2xl p-4 space-y-3 shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold block">Recent Scans Feed</span>
            <div className="space-y-2">
              {recentScans.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-[#FAF7F2] rounded-lg border border-amber-100">
                  <div>
                    <span className="font-bold text-[#1C160F] block">{s.name || s.token}</span>
                    <span className="text-[10px] text-slate-500">{s.time}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${s.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
