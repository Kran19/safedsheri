'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface Sponsor3DGalleryProps {
  onOpenSponsorModal?: () => void;
}

export function Sponsor3DGallery({ onOpenSponsorModal }: Sponsor3DGalleryProps) {
  return (
    <section 
      id="sponsors"
      className="relative py-12 sm:py-16 md:py-20 px-4 overflow-hidden bg-cover bg-center bg-no-repeat select-none w-full flex flex-col justify-center min-h-[calc(100vh-80px)]"
      style={{ backgroundImage: `url('/images/sponsor-bg.png')` }}
    >
      {/* Ambient soft glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/30 to-white/80 pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col items-center justify-center my-auto space-y-6 sm:space-y-8">
        
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          {/* Top Decorative Pill */}
          <div className="inline-flex items-center justify-center space-x-3 px-4 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#D99427]/40 shadow-sm">
            <span className="h-[1px] w-5 bg-[#D99427]" />
            <span className="text-[10px] font-mono tracking-[0.25em] font-bold text-[#8C6019] uppercase">
              OUR SPONSOR
            </span>
            <span className="h-[1px] w-5 bg-[#D99427]" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#2A1D0D] tracking-tight leading-tight">
            Supported by <span className="text-[#B8860B] font-serif font-semibold">Visionary Partners</span>
          </h2>

          {/* Subheading */}
          <p className="text-[11px] sm:text-xs text-[#5D4A36] max-w-lg mx-auto leading-relaxed font-sans opacity-90">
            We are proud to be supported by industry leaders who believe in innovation, creativity and a better tomorrow.
          </p>
        </div>

        {/* SINGLE RADHIKA SPONSOR CARD */}
        <div className="w-[280px] sm:w-[320px] md:w-[360px] h-[300px] sm:h-[340px] rounded-3xl p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(184,134,11,0.35)] ring-2 ring-[#D99427] bg-[#1c1917] backdrop-blur-xl relative transition-all duration-300 hover:scale-105">
          {/* Top Badge area */}
          <div className="flex justify-end items-center w-full">
            <Sparkles className="w-4 h-4 text-[#F6C85F] animate-pulse" />
          </div>

          {/* Main Logo Content Area */}
          <div className="flex flex-col items-center justify-center text-center my-auto space-y-3 w-full h-full py-4">
            <div className="relative w-full h-full max-h-[180px] flex items-center justify-center py-2 px-4">
              <Image
                src="/images/sponsoe1.png"
                alt="Radhika"
                width={260}
                height={140}
                className="object-contain max-h-full drop-shadow-2xl transition-all duration-500 hover:scale-105"
                style={{
                  filter: 'invert(1) hue-rotate(180deg) brightness(2) contrast(1.25)'
                }}
                priority
              />
            </div>
          </div>

          {/* Card Bottom Tagline */}
          <div className="pt-3 border-t border-[#D99427]/30 bg-[#241e1a] text-center rounded-b-2xl -mx-6 -mb-6 p-3.5">
            <p className="text-xs sm:text-sm font-sans font-medium italic text-amber-200">
              &ldquo;Powered By&rdquo;
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
