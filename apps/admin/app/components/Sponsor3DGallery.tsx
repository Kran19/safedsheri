'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { garbaAudio } from './GarbaAudioEngine';
import { Sparkles, Crown, ChevronLeft, ChevronRight, Handshake, ArrowRight } from 'lucide-react';

export interface SponsorItem {
  id: string;
  name: string;
  tagline: string;
  logoSrc?: string;
  isPlaceholder?: boolean;
}

// Exactly 4 Sponsor Frames
const SPONSORS_LIST: SponsorItem[] = [
  {
    id: 'sponsor-1',
    name: 'BE OUR SPONSOR',
    tagline: 'Join Gujarat’s Premier Cultural Gala',
    isPlaceholder: true,
  },
  {
    id: 'sponsor-radhika',
    name: 'RADHIKA',
    tagline: 'Official Featured Luxury Partner',
    logoSrc: '/images/sponsoe1.png',
    isPlaceholder: false,
  },
  {
    id: 'sponsor-3',
    name: 'BE OUR SPONSOR',
    tagline: 'Reach 10,000+ High-Net-Worth Guests',
    isPlaceholder: true,
  },
  {
    id: 'sponsor-4',
    name: 'BE OUR SPONSOR',
    tagline: 'Prominent Arena & Stage Branding',
    isPlaceholder: true,
  },
];

interface Sponsor3DGalleryProps {
  onOpenSponsorModal?: () => void;
}

export function Sponsor3DGallery({ onOpenSponsorModal }: Sponsor3DGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(1); // Start centered on Radhika (index 1)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef<number | null>(null);

  const numSponsors = SPONSORS_LIST.length; // 4 frames

  // Auto-slide loop every 2.8 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % numSponsors);
    }, 2800);

    return () => clearInterval(interval);
  }, [isAutoPlaying, numSponsors]);

  const handleNext = () => {
    try { garbaAudio?.playDandiya(); } catch {}
    setActiveIndex((prev) => (prev + 1) % numSponsors);
  };

  const handlePrev = () => {
    try { garbaAudio?.playDandiya(); } catch {}
    setActiveIndex((prev) => (prev - 1 + numSponsors) % numSponsors);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 30) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  return (
    <section 
      id="sponsors"
      className="relative py-6 sm:py-8 md:py-10 px-4 overflow-hidden bg-cover bg-center bg-no-repeat select-none w-full flex flex-col justify-center min-h-[calc(100vh-80px)]"
      style={{ backgroundImage: `url('/images/sponsor-bg.png')` }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient soft glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/30 to-white/80 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col justify-between my-auto">
        
        {/* Header section matching reference design */}
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-4 sm:mb-6">
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

        {/* 3D CAROUSEL CONTAINER */}
        <div className="relative h-[270px] sm:h-[300px] md:h-[330px] w-full flex items-center justify-center my-2">
          
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 md:left-10 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-gray-200/90 flex items-center justify-center text-gray-700 hover:text-[#B8860B] hover:scale-110 transition duration-300 focus:outline-none"
            aria-label="Previous Sponsor"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-6 md:right-10 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-gray-200/90 flex items-center justify-center text-gray-700 hover:text-[#B8860B] hover:scale-110 transition duration-300 focus:outline-none"
            aria-label="Next Sponsor"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          {/* Carousel Cards Track */}
          <div className="relative w-full max-w-5xl h-full flex items-center justify-center overflow-hidden">
            {SPONSORS_LIST.map((sponsor, idx) => {
              // Position math for 4 items:
              // offset 0: center active card
              // offset 1: right card
              // offset 3: left card
              // offset 2: hidden back card
              const rawOffset = (idx - activeIndex + numSponsors) % numSponsors;

              let translateX = 0;
              let scale = 0.85;
              let zIndex = 10;
              let opacity = 0;
              let isCenter = false;

              if (rawOffset === 0) {
                // Center active card
                isCenter = true;
                translateX = 0;
                scale = 1.05;
                zIndex = 30;
                opacity = 1;
              } else if (rawOffset === 1) {
                // Right card
                translateX = 240;
                scale = 0.86;
                zIndex = 20;
                opacity = 0.9;
              } else if (rawOffset === 3) {
                // Left card
                translateX = -240;
                scale = 0.86;
                zIndex = 20;
                opacity = 0.9;
              } else {
                // Hidden 4th card in background
                translateX = 0;
                scale = 0.6;
                zIndex = 5;
                opacity = 0;
              }

              return (
                <div
                  key={sponsor.id}
                  onClick={() => {
                    if (!isCenter) {
                      try { garbaAudio?.playDhol(); } catch {}
                      setActiveIndex(idx);
                    } else if (sponsor.isPlaceholder && onOpenSponsorModal) {
                      onOpenSponsorModal();
                    }
                  }}
                  className={`absolute w-[210px] sm:w-[240px] md:w-[270px] h-[235px] sm:h-[265px] md:h-[290px] rounded-2xl md:rounded-3xl transition-all duration-700 ease-out cursor-pointer flex flex-col justify-between p-4 sm:p-5 ${
                    isCenter
                      ? 'shadow-[0_15px_45px_rgba(184,134,11,0.4)] ring-2 ring-[#D99427]'
                      : 'shadow-md border border-white/80 hover:shadow-xl'
                  }`}
                  style={{
                    transform: `translateX(${translateX}px) scale(${scale})`,
                    zIndex: zIndex,
                    opacity: opacity,
                    backgroundColor: isCenter 
                      ? '#1c1917' 
                      : 'rgba(255, 255, 255, 0.96)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {/* Top Badge area */}
                  <div className="flex justify-between items-center w-full">
                    <span
                      className={`text-[8px] sm:text-[9px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                        isCenter
                          ? 'bg-gradient-to-r from-[#D99427] to-[#B8860B] text-white shadow-sm'
                          : 'bg-amber-50 text-[#8C6019] border border-[#D99427]/30'
                      }`}
                    >
                      {sponsor.isPlaceholder ? 'OPPORTUNITY' : 'FEATURED PARTNER'}
                    </span>
                    {isCenter && (
                      <Sparkles className="w-3.5 h-3.5 text-[#F6C85F] animate-pulse" />
                    )}
                  </div>

                  {/* Main Logo / Content Area */}
                  <div className="flex flex-col items-center justify-center text-center my-auto space-y-2 w-full h-full">
                    {!sponsor.isPlaceholder && sponsor.logoSrc ? (
                      /* Real Sponsor Logo (Radhika) - Clean Logo image without double text */
                      <div className="relative w-full h-full max-h-[160px] flex items-center justify-center p-2">
                        <Image
                          src={sponsor.logoSrc}
                          alt={sponsor.name}
                          width={240}
                          height={120}
                          className="object-contain max-h-full drop-shadow-lg transition-transform duration-300 hover:scale-105"
                          priority
                        />
                      </div>
                    ) : (
                      /* Placeholder Cards: Clean "BE OUR SPONSOR" */
                      <div className="flex flex-col items-center space-y-3 py-2 w-full">
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-transform duration-300 ${
                            isCenter
                              ? 'bg-[#2A241F] border-[#D99427]/60 text-[#F6C85F]'
                              : 'bg-amber-50/90 border-amber-200 text-[#B8860B]'
                          }`}
                        >
                          <Handshake className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div className="w-full px-1">
                          <h3
                            className={`text-lg sm:text-xl md:text-2xl font-serif font-black tracking-tight uppercase ${
                              isCenter ? 'text-white' : 'text-[#2A1D0D]'
                            }`}
                          >
                            {sponsor.name}
                          </h3>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom CTA / Tagline */}
                  <div
                    className={`pt-2 border-t text-center rounded-b-xl -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 ${
                      isCenter
                        ? 'border-[#D99427]/30 bg-[#241e1a]'
                        : 'border-gray-100 bg-gray-50/90'
                    }`}
                  >
                    {sponsor.isPlaceholder ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenSponsorModal) onOpenSponsorModal();
                        }}
                        className={`w-full py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                          isCenter
                            ? 'bg-gradient-to-r from-[#F6C85F] to-[#D99427] text-[#1c1917] hover:brightness-110 shadow-md'
                            : 'bg-amber-100/90 text-[#8C6019] hover:bg-amber-200'
                        }`}
                      >
                        <span>BE OUR SPONSOR</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <p
                        className={`text-[10px] font-sans font-medium italic truncate ${
                          isCenter ? 'text-amber-200' : 'text-gray-600'
                        }`}
                      >
                        &ldquo;{sponsor.tagline}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Floor Reflection Line */}
        <div className="w-full max-w-xl mx-auto h-2 bg-gradient-to-b from-[#D99427]/20 to-transparent rounded-full blur-xs mt-1 mb-3" />

        {/* 4 Pagination Dots */}
        <div className="flex items-center justify-center space-x-2 mt-1">
          {SPONSORS_LIST.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => {
                try { garbaAudio?.playDandiya(); } catch {}
                setActiveIndex(dotIdx);
              }}
              className={`transition-all duration-300 focus:outline-none ${
                activeIndex === dotIdx
                  ? 'w-7 h-2 rounded-full bg-gradient-to-r from-[#F6C85F] to-[#D99427] shadow-md'
                  : 'w-2 h-2 rounded-full bg-gray-300/80 hover:bg-[#D99427]/60'
              }`}
              aria-label={`Go to slide ${dotIdx + 1}`}
            />
          ))}
        </div>

        {/* Bottom CTA Button */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              try { garbaAudio?.playDhol(); } catch {}
              if (onOpenSponsorModal) onOpenSponsorModal();
            }}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#2A1D0D] via-[#3D2C17] to-[#2A1D0D] hover:from-[#3D2C17] hover:to-[#4D391F] text-[#F6C85F] border border-[#D99427]/60 font-serif font-bold text-[11px] uppercase tracking-widest shadow-lg transition-all hover:scale-105"
          >
            <Crown className="w-3.5 h-3.5 text-[#F6C85F]" />
            <span>BECOME AN OFFICIAL SPONSOR</span>
            <Sparkles className="w-3.5 h-3.5 text-[#F6C85F]" />
          </button>
        </div>

      </div>
    </section>
  );
}
