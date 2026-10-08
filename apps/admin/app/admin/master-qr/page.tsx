'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '../../../lib/api';
import MasterPassesQRView from '../../components/MasterPassesQRView';
import { ArrowLeft, ShieldAlert, Lock, Home } from 'lucide-react';
import Link from 'next/link';

export default function MasterQRPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#D99427] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Strict Master Admin check
  if (currentUser?.username !== 'masteradmin@safedsheri.com') {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white border-2 border-rose-300 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-10 h-10" />
        </div>
        <div>
          <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-mono font-bold rounded-full uppercase tracking-wider">
            Strict Access Restricted
          </span>
          <h2 className="text-3xl font-serif font-bold text-rose-950 mt-3">Master Admin Clearance Required</h2>
          <p className="text-sm text-rose-800 mt-2 max-w-md mx-auto">
            This page contains all live entry QR credentials across Single Female, Couple, Kids, and Gazebo passes. It is accessible exclusively to <strong className="font-mono">masteradmin@safedsheri.com</strong>.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#2D1F0E] text-[#FAF6EE] font-bold text-xs uppercase tracking-wider hover:bg-[#3D2C15] transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Admin Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAD9B8]">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-[#EAD9B8] text-[#6E5336] hover:text-[#2D1F0E] hover:bg-[#FAF6EE] font-bold text-xs uppercase tracking-wider transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs text-[#8C6019] font-mono">/ Master QR Passes Directory</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
            <span>👑</span>
            <span>Master Admin Verified</span>
          </span>
        </div>
      </div>

      {/* Main Passes QR Directory View */}
      <MasterPassesQRView currentUser={currentUser} />
    </div>
  );
}
