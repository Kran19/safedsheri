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

      <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col items-center justify-center my-auto space-y-6 sm:space-y-8">
        
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          {/* Top Decorative Pill */}
          <div className="inline-flex items-center justify-center space-x-3 px-4 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#D99427]/40 shadow-sm">
            <span className="h-[1px] w-5 bg-[#D99427]" />
            <span className="text-[10px] font-mono tracking-[0.25em] font-bold text-[#8C6019] uppercase">
              OUR SPONSORS
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

        {/* SPONSOR CARDS CONTAINER */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 w-full max-w-4xl">
          {/* RADHIKA JEWELLERS - POWERED BY */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] h-[320px] sm:h-[360px] rounded-3xl p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(217,148,39,0.2)] ring-1 ring-[#D99427]/50 bg-white/95 backdrop-blur-xl relative transition-all duration-300 hover:scale-105 hover:shadow-[0_25px_60px_rgba(217,148,39,0.3)]">
            {/* Top Badge area */}
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#8C6019] uppercase bg-[#FAF6EE] px-2.5 py-1 rounded-full border border-[#D99427]/30">
                TITLE SPONSOR
              </span>
              <Sparkles className="w-4 h-4 text-[#D99427] animate-pulse" />
            </div>

            {/* Main Logo Content Area */}
            <div className="flex flex-col items-center justify-center text-center my-auto space-y-3 w-full h-full py-2">
              <div className="relative w-full h-full max-h-[220px] flex items-center justify-center py-2 px-2">
                <Image
                  src="/images/sponsoe1.png"
                  alt="Radhika Jewellers"
                  width={300}
                  height={200}
                  className="object-contain max-h-full transition-all duration-500 hover:scale-105"
                  priority
                />
              </div>
            </div>

            {/* Card Bottom Tagline */}
            <div className="pt-3 border-t border-[#D99427]/20 bg-[#FAF6EE] text-center rounded-b-2xl -mx-6 -mb-6 p-3.5">
              <p className="text-xs sm:text-sm font-serif font-semibold italic text-[#8C6019]">
                &ldquo;Powered By&rdquo;
              </p>
            </div>
          </div>

          {/* SHREE SADGURU LIFESTYLE - CO-POWERED BY */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] h-[320px] sm:h-[360px] rounded-3xl p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(217,148,39,0.2)] ring-1 ring-[#D99427]/50 bg-white/95 backdrop-blur-xl relative transition-all duration-300 hover:scale-105 hover:shadow-[0_25px_60px_rgba(217,148,39,0.3)]">
            {/* Top Badge area */}
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#8C6019] uppercase bg-[#FAF6EE] px-2.5 py-1 rounded-full border border-[#D99427]/30">
                CO-POWERED SPONSOR
              </span>
              <Sparkles className="w-4 h-4 text-[#D99427] animate-pulse" />
            </div>

            {/* Main Logo Content Area */}
            <div className="flex flex-col items-center justify-center text-center my-auto space-y-3 w-full h-full py-2">
              <div className="relative w-full h-full max-h-[220px] flex items-center justify-center py-2 px-2">
                <Image
                  src="/images/sadguru-logo.png"
                  alt="Shree Sadguru Lifestyle"
                  width={300}
                  height={200}
                  className="object-contain max-h-full transition-all duration-500 hover:scale-105 rounded-xl"
                  priority
                />
              </div>
            </div>

            {/* Card Bottom Tagline */}
            <div className="pt-3 border-t border-[#D99427]/20 bg-[#FAF6EE] text-center rounded-b-2xl -mx-6 -mb-6 p-3.5">
              <p className="text-xs sm:text-sm font-serif font-semibold italic text-[#8C6019]">
                &ldquo;Co-Powered By&rdquo;
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
