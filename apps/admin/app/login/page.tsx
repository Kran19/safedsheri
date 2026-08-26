'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, setStoredAuth } from '../../lib/api';
import LogoSlot from '../components/LogoSlot';
import { Lock, User, KeyRound, AlertCircle, ArrowRight, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (res.success && res.data?.accessToken) {
        setStoredAuth(res.data.accessToken, res.data.user);
        const role = res.data.user.role;
        if (role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else if (role === 'TICKETING_FINANCE' || role === 'CASHIER') {
          router.push('/cashier');
        } else if (role === 'ENTRY_VERIFICATION' || role === 'SECURITY') {
          router.push('/security');
        } else {
          router.push('/');
        }
      } else {
        setError(res.error?.message || 'Invalid username or password. Please verify credentials.');
      }
    } catch (err: any) {
      setError('Connection failed. Ensure API service is reachable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9] text-[#2D1F0E] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#F6C85F]/50">
      <div className="max-w-md w-full bg-white border-2 border-[#EAD9B8] rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Logo & Title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <LogoSlot size="md" />
          </div>
          <span className="text-[10px] font-mono tracking-[0.25em] font-bold text-[#8C6019] uppercase block">
            SAFED SHERI 2026
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F0E]">Staff Authentication</h1>
          <p className="text-xs text-[#6E5336]">
            Secure login for Super Admin, Finance Box Office, and Gate Security Verification.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#6E5336] mb-1.5">Staff Email / Username</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="name@safedsheri.com"
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none"
              />
              <User className="w-4 h-4 text-[#8C6019] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6E5336] mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none"
              />
              <KeyRound className="w-4 h-4 text-[#8C6019] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition shadow-lg shadow-[#D99427]/25 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Terminal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
