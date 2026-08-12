'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, setAuthToken, getStoredUser } from '../../lib/api';
import { Shield, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import LogoSlot from '../components/LogoSlot';

export default function StaffLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin@safedsheri.com');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (user.role === 'SUPER_ADMIN') router.push('/admin');
      else if (user.role === 'TICKETING_FINANCE' || user.role === 'CASHIER') router.push('/cashier');
      else if (user.role === 'ENTRY_VERIFICATION' || user.role === 'SECURITY') router.push('/security');
    }
  }, [router]);

  async function handleLogin(e?: React.FormEvent, customUser?: string, customPass?: string) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const u = customUser || username;
    const p = customPass || password;

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: u, password: p }),
    });

    setLoading(false);

    if (res.success && res.data) {
      setAuthToken(res.data.accessToken);
      localStorage.setItem('safedsheri_user', JSON.stringify(res.data.user));
      const role = res.data.user.role;
      if (role === 'SUPER_ADMIN') router.push('/admin');
      else if (role === 'TICKETING_FINANCE' || role === 'CASHIER') router.push('/cashier');
      else if (role === 'ENTRY_VERIFICATION' || role === 'SECURITY') router.push('/security');
    } else {
      setError(res.error?.message || 'Login failed. Please check credentials.');
    }
  }

  function fillAndLogin(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    handleLogin(undefined, u, p);
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2319] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-amber-400/30 rounded-3xl p-8 shadow-xl relative z-10">
        <div className="text-center mb-8 space-y-2">
          <LogoSlot className="justify-center mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1C160F] font-cinzel">STAFF TERMINAL LOGIN</h1>
          <p className="text-xs text-amber-800 font-mono tracking-widest uppercase">Safed Sheri 2026 • 09.10.2026</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handleLogin(e)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Staff Username / Email
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-3 text-amber-700" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-amber-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="user@safedsheri.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-amber-700" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-amber-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-[#1C160F] focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:from-amber-500 hover:to-yellow-600 focus:outline-none transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Operational Terminal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-amber-200">
          <p className="text-xs font-semibold uppercase text-amber-800 mb-3 text-center tracking-wider">
            One-Click Login to Terminals
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillAndLogin('admin@safedsheri.com', 'AdminPass123!')}
              className="px-2 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 text-center transition-all shadow-xs"
            >
              Super Admin (/admin)
            </button>
            <button
              onClick={() => fillAndLogin('cashier1@safedsheri.com', 'CashierPass123!')}
              className="px-2 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 text-center transition-all shadow-xs"
            >
              Cashier (/cashier)
            </button>
            <button
              onClick={() => fillAndLogin('gate1@safedsheri.com', 'SecurityPass123!')}
              className="px-2 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 text-center transition-all shadow-xs"
            >
              Security (/security)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
