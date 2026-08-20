'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, clearAuthToken } from '../../lib/api';
import { Shield, LogOut } from 'lucide-react';
import LogoSlot from '../components/LogoSlot';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== 'SUPER_ADMIN') {
      router.push('/login');
    } else {
      setUser(u);
    }
  }, [router]);

  function handleLogout() {
    clearAuthToken();
    router.push('/login');
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D2319] flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-amber-300/40 flex items-center justify-between px-6 sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <LogoSlot />
          <div className="hidden md:block">
            <h1 className="text-base font-bold text-[#1C160F] tracking-wide font-cinzel">SAFED SHERI</h1>
            <p className="text-xs text-amber-800 font-mono">Super Admin Control Center • 09.10.2026</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right text-xs">
            <p className="font-semibold text-[#1C160F]">{user.fullName}</p>
            <p className="text-amber-800 uppercase font-mono tracking-wider font-bold">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg transition-colors shadow-xs flex items-center gap-1 text-xs font-bold"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 text-amber-700" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
