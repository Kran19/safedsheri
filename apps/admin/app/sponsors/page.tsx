'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sponsor3DGallery } from '../components/Sponsor3DGallery';
import LogoSlot from '../components/LogoSlot';
import { ArrowLeft } from 'lucide-react';

export default function SponsorsPage() {
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#FFFDF9] text-[#2D1F0E]">
      {/* Top Header Navigation */}
      <header className="py-6 px-6 border-b border-[#EAD9B8] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#8C6019] hover:text-[#2D1F0E] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <LogoSlot size="sm" showText={true} showDate={false} />

          <button
            onClick={() => setIsSponsorModalOpen(true)}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition"
          >
            Be Our Sponsor
          </button>
        </div>
      </header>

      {/* Main Sponsor 3D Gallery Section */}
      <Sponsor3DGallery onOpenSponsorModal={() => setIsSponsorModalOpen(true)} />

      {/* Footer minimal */}
      <footer className="py-8 px-6 bg-[#FAF6EE] border-t border-[#EAD9B8] text-center text-xs text-[#8C6019]">
        <p>© 2026 Safed Sheri • Corporate Sponsorship & Brand Alliances</p>
      </footer>
    </main>
  );
}
