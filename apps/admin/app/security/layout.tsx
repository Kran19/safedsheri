'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, clearAuthToken } from '../../lib/api';
import { Shield, LogOut, Ticket } from 'lucide-react';
import LogoSlot from '../components/LogoSlot';

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || (u.role !== 'SECURITY' && u.role !== 'SUPER_ADMIN' && u.role !== 'ENTRY_VERIFICATION')) {
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
      {/* Minimal Top Bar for Gate Scanner */}
      <header className="h-16 bg-white border-b border-amber-300/40 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <LogoSlot />
          <div className="hidden md:block">
            <h1 className="text-sm md:text-base font-bold text-[#1C160F] tracking-wide font-cinzel">GATE SCANNER</h1>
            <p className="text-[10px] md:text-xs text-amber-800 font-semibold font-mono">Safed Sheri 2026 Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-xs font-bold text-[#1C160F]">{user.fullName}</span>
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

      <main className="flex-1 flex flex-col justify-center items-center p-4">
        {children}
      </main>
    </div>
  );
}
