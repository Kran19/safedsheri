'use client';

import React, { useState, useEffect, useRef } from 'react';
import { garbaAudio } from './GarbaAudioEngine';
import { Sparkles, Crown, Award, ExternalLink, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  category: string;
  tier: 'TITLE' | 'POWERED_BY' | 'ASSOCIATE' | 'HOSPITALITY' | 'BEVERAGE' | 'MEDIA';
  logoSvg: React.ReactNode;
  tagline: string;
  badgeColor: string;
  accentBg: string;
  establishedYear?: string;
}

const SPONSORS: Sponsor[] = [
  {
    id: '1',
    name: 'Jade Blue Lifestyle',
    category: 'Official Luxury Ethnic Wear Partner',
    tier: 'TITLE',
    logoSvg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#2D1F0E" stroke="#D99427" strokeWidth="2.5" />
        <path d="M35 32H65V38H53V68H47V38H35V32Z" fill="#F6C85F" />
        <path d="M42 45L50 55L58 45" stroke="#FFF5DC" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="50" r="40" stroke="#EAD9B8" strokeWidth="1" strokeDasharray="3 3" />
      </svg>
    ),
    tagline: 'Elegance in Pure White Chaniya Cholis & Kurtas',
    badgeColor: 'from-[#F6C85F] to-[#D99427]',
    accentBg: 'from-[#FAF6EE] to-[#FFF9EE]',
    establishedYear: 'EST. 1995',
  },
  {
    id: '2',
    name: 'The Imperial Palace',
    category: 'Grand Venue & Hospitality Partner • Rajkot',
    tier: 'POWERED_BY',
    logoSvg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="84" height="84" rx="20" fill="#24180A" stroke="#E5A93C" strokeWidth="2" />
        <circle cx="50" cy="50" r="30" stroke="#F6C85F" strokeWidth="3" />
        <path d="M50 28V72M28 50H72" stroke="#FAF6EE" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="50" r="12" fill="#D99427" />
        <text x="50" y="54" textAnchor="middle" fill="#2D1F0E" fontSize="10" fontWeight="bold" fontFamily="serif">IP</text>
      </svg>
    ),
    tagline: 'Rajkot’s Premier Luxury Heritage Arena & Gazebo Suites',
    badgeColor: 'from-[#E5A93C] to-[#8C6019]',
    accentBg: 'from-[#FFFDF9] to-[#FAF6EE]',
    establishedYear: 'RAJKOT',
  },
  {
    id: '3',
    name: 'Wagh Bakri Tea Group',
    category: 'Official Refreshment Partner',
    tier: 'ASSOCIATE',
    logoSvg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#422507" stroke="#F6C85F" strokeWidth="2" />
        <path d="M30 60C35 68 65 68 70 60C72 52 68 45 50 45C32 45 28 52 30 60Z" fill="#D99427" />
        <path d="M42 34C42 34 46 26 50 34C54 42 50 44 50 44" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="52" r="5" fill="#FFF" />
      </svg>
    ),
    tagline: 'Warmth of Gujarat in Every Sacred Garba Rhythm',
    badgeColor: 'from-amber-600 to-amber-800',
    accentBg: 'from-[#FFF9EE] to-[#FAF6EE]',
    establishedYear: 'EST. 1892',
  },
  {
    id: '4',
    name: 'Havmor Gourmet',
    category: 'Gourmet Dessert & Stalls Partner',
    tier: 'HOSPITALITY',
    logoSvg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="84" height="84" rx="22" fill="#8B1E22" stroke="#F6C85F" strokeWidth="2" />
        <path d="M32 48C32 36 68 36 68 48C68 58 50 72 50 72C50 72 32 58 32 48Z" fill="#FFF5DC" />
        <circle cx="50" cy="44" r="8" fill="#D99427" />
        <text x="50" y="47" textAnchor="middle" fill="#8B1E22" fontSize="9" fontWeight="bold">HV</text>
      </svg>
    ),
    tagline: 'Pure Festive Indulgence for 10,000+ Guests',
    badgeColor: 'from-red-600 to-rose-800',
    accentBg: 'from-[#FFFDF9] to-[#FFF5DC]',
    establishedYear: 'EST. 1944',
  },
  {
    id: '5',
    name: 'Red FM 93.5',
    category: 'Official Broadcast & Radio Partner',
    tier: 'MEDIA',
    logoSvg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#C4161C" stroke="#F6C85F" strokeWidth="2" />
        <path d="M30 45C30 45 42 32 60 38C70 42 72 58 60 64C50 68 40 58 40 58" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="50" r="7" fill="#F6C85F" />
        <text x="50" y="78" textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif">93.5</text>
      </svg>
    ),
    tagline: 'Bajaate Raho — Broadcasting the White Night Live',
    badgeColor: 'from-orange-500 to-amber-600',
    accentBg: 'from-[#FFFDF9] to-[#FAF6EE]',
    establishedYear: 'AIRWAVES',
  },
  {
    id: '6',
    name: 'Tanishq Jewellers',
    category: 'Royal Gold & Diamond Partner',
    tier: 'ASSOCIATE',
    logoSvg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#241B12" stroke="#E5A93C" strokeWidth="2" />
        <path d="M50 22L68 45L50 78L32 45L50 22Z" stroke="#F6C85F" strokeWidth="2.5" fill="none" />
        <path d="M32 45H68" stroke="#F6C85F" strokeWidth="2" />
        <path d="M50 22L50 78" stroke="#EAD9B8" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="50" cy="45" r="4" fill="#FFF" />
      </svg>
    ),
    tagline: 'Adorning the Divine Festivities of Gujarat',
    badgeColor: 'from-[#F6C85F] to-[#E5A93C]',
    accentBg: 'from-[#FFFDF9] to-[#FFF9EE]',
    establishedYear: 'ROYALTY',
  },
  {
    id: '7',
    name: 'ICICI Bank',
    category: 'Official Digital Payments & UPI Partner',
    tier: 'ASSOCIATE',
    logoSvg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="84" height="84" rx="20" fill="#B3282D" stroke="#D99427" strokeWidth="2" />
        <circle cx="50" cy="50" r="28" stroke="#FFF" strokeWidth="3" />
        <path d="M42 36H58V44H50V64H42V36Z" fill="#F6C85F" />
        <circle cx="62" cy="50" r="4" fill="#FFF" />
      </svg>
    ),
    tagline: '100% Seamless & Instant Ticketing Checkout',
    badgeColor: 'from-orange-600 to-red-800',
    accentBg: 'from-[#FFFDF9] to-[#FAF6EE]',
    establishedYear: 'FINANCE',
  },
  {
    id: '8',
    name: 'BMW Gallops Motors',
    category: 'Official Luxury Mobility Partner',
    tier: 'HOSPITALITY',
    logoSvg: (
      <svg viewBox="0 0 100 100" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#1C2331" stroke="#D99427" strokeWidth="2" />
        <circle cx="50" cy="50" r="32" stroke="#FFF" strokeWidth="2" fill="#0D1117" />
        <path d="M50 20V50H80" fill="#0066B1" />
        <path d="M50 80V50H20" fill="#0066B1" />
        <path d="M50 20V50H20" fill="#FFF" />
        <path d="M50 80V50H80" fill="#FFF" />
        <circle cx="50" cy="50" r="32" stroke="#D99427" strokeWidth="1.5" fill="none" />
      </svg>
    ),
    tagline: 'Chauffeured VIP Valet for Gazebo Cabanas',
    badgeColor: 'from-blue-600 to-slate-800',
    accentBg: 'from-[#FFFDF9] to-[#F0F4F8]',
    establishedYear: 'MOTORS',
  },
];

interface Sponsor3DGalleryProps {
  onOpenSponsorModal?: () => void;
}

export function Sponsor3DGallery({ onOpenSponsorModal }: Sponsor3DGalleryProps) {
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const numSponsors = SPONSORS.length;
  const angleStep = 360 / numSponsors;
  const radius = 380; // Distance from center in 3D space

  // Auto rotation loop
  useEffect(() => {
    if (!isAutoPlaying || isHovered || isDragging) return;
    const timer = setInterval(() => {
      setRotation((prev) => prev - 0.4);
    }, 30);
    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, isDragging]);

  // Update active index based on rotation angle
  useEffect(() => {
    const normalized = ((-rotation % 360) + 360) % 360;
    const closestIdx = Math.round(normalized / angleStep) % numSponsors;
    setActiveIndex(closestIdx);
  }, [rotation, angleStep, numSponsors]);

  const rotateTo = (index: number) => {
    garbaAudio.playDandiya();
    const targetAngle = -index * angleStep;
    setRotation(targetAngle);
  };

  const handleNext = () => {
    garbaAudio.playDandiya();
    setRotation((prev) => prev - angleStep);
  };

  const handlePrev = () => {
    garbaAudio.playDandiya();
    setRotation((prev) => prev + angleStep);
  };

  // Drag to rotate handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setRotation((prev) => prev + deltaX * 0.35);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <section className="relative py-24 px-6 overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-white border-t border-[#EAD9B8]">
      {/* Background Decorative Embers */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#FFF5DC] via-[#FAF6EE] to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full bg-[#FFF5DC] border border-[#E5A93C]">
            <Crown className="w-3.5 h-3.5 text-[#D99427]" />
            <span className="text-[10px] font-mono tracking-[0.3em] font-bold text-[#8C6019] uppercase">
              DISTINGUISHED BRAND ALLIANCES
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#2D1F0E] tracking-tight">
            Our Esteemed Partners
          </h2>
          <p className="text-xs md:text-sm text-[#6E5336] leading-relaxed">
            Drag or rotate to explore the visionary corporate brands powering Gujarat&apos;s most prestigious Navratri cultural gala in Rajkot.
          </p>
        </div>

        {/* 3D CAROUSEL CONTAINER */}
        <div
          className="relative h-[480px] w-full flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
          style={{ perspective: '1400px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsDragging(false);
          }}
        >
          {/* 3D CYLINDER ROTATOR */}
          <div
            className="relative w-[300px] h-[360px] transition-transform duration-75"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotation}deg)`,
            }}
          >
            {SPONSORS.map((s, idx) => {
              const cardAngle = idx * angleStep;
              const isCurrent = activeIndex === idx;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    garbaAudio.playDhol();
                    rotateTo(idx);
                  }}
                  className={`absolute inset-0 rounded-3xl p-6 bg-gradient-to-b ${s.accentBg} backdrop-blur-xl border-2 transition-all duration-300 shadow-2xl flex flex-col justify-between`}
                  style={{
                    transform: `rotateY(${cardAngle}deg) translateZ(${radius}px)`,
                    borderColor: isCurrent ? '#D99427' : '#EAD9B8',
                    boxShadow: isCurrent
                      ? '0 25px 50px -12px rgba(217, 148, 39, 0.4), 0 0 0 1.5px #D99427'
                      : '0 10px 25px -5px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  {/* Top Badge */}
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase text-white bg-gradient-to-r ${s.badgeColor} shadow-md`}
                    >
                      {s.tier.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-1 text-[9px] font-mono font-bold text-[#8C6019]">
                      <span>{s.establishedYear}</span>
                      <Sparkles className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#D99427] animate-spin' : 'text-[#EAD9B8]'}`} />
                    </div>
                  </div>

                  {/* Logo / Brand Name Center */}
                  <div className="text-center my-auto space-y-3">
                    <div className="flex justify-center transform hover:scale-110 transition duration-300 filter drop-shadow-md">
                      {s.logoSvg}
                    </div>
                    <div>
                      <h4 className="text-lg md:text-xl font-serif font-bold text-[#2D1F0E] tracking-tight">{s.name}</h4>
                      <p className="text-[11px] font-semibold text-[#8C6019] mt-0.5 leading-snug">{s.category}</p>
                    </div>
                  </div>

                  {/* Bottom Tagline & Prompt */}
                  <div className="pt-3 border-t border-[#EAD9B8] text-center bg-white/60 -mx-6 -mb-6 p-4 rounded-b-3xl">
                    <p className="text-[10px] text-[#6E5336] italic leading-tight">&ldquo;{s.tagline}&rdquo;</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3D CONTROLS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-[#EAD9B8] text-xs">
          {/* Active Sponsor Name Indicator */}
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-bold text-[#8C6019] uppercase tracking-wider">Spotlight Partner:</span>
            <span className="font-serif font-bold text-[#2D1F0E] text-sm bg-white px-3 py-1 rounded-xl border border-[#EAD9B8] shadow-sm">
              {SPONSORS[activeIndex]?.name} ({SPONSORS[activeIndex]?.tier.replace('_', ' ')})
            </span>
          </div>

          {/* Navigation & Rotation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-full bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] transition shadow-sm"
              title="Rotate Left"
            >
              <ChevronLeft className="w-4 h-4 text-[#D99427]" />
            </button>

            <button
              onClick={() => {
                garbaAudio.playDandiya();
                setIsAutoPlaying(!isAutoPlaying);
              }}
              className="px-4 py-2 rounded-full bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#D99427]" />
                  <span>Pause 3D Orbit</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resume 3D Orbit</span>
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-2.5 rounded-full bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] transition shadow-sm"
              title="Rotate Right"
            >
              <ChevronRight className="w-4 h-4 text-[#D99427]" />
            </button>
          </div>

          {/* Sponsor Deck Direct CTA */}
          <div>
            <button
              onClick={() => {
                garbaAudio.playDhol();
                onOpenSponsorModal?.();
              }}
              className="px-5 py-2.5 rounded-full bg-[#2D1F0E] hover:bg-[#4A351B] text-white font-bold text-xs uppercase tracking-wider transition shadow-md inline-flex items-center space-x-2"
            >
              <span>Partner With Us</span>
              <Sparkles className="w-3.5 h-3.5 text-[#F6C85F]" />
            </button>
          </div>
        </div>

        {/* LUXURY SPONSORSHIP INQUIRY CTA BANNER */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#24180A] via-[#2D1F0E] to-[#1A1105] border-2 border-[#D99427]/60 shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#D99427]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-2 text-center md:text-left z-10 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFF5DC]/10 border border-[#D99427]/40 text-[#F6C85F] text-[10px] font-mono tracking-widest font-bold uppercase">
              <Crown className="w-3.5 h-3.5 text-[#F6C85F]" />
              <span>CORPORATE PARTNERSHIP INQUIRIES OPEN</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#FFF5DC] tracking-tight">
              Showcase Your Brand to 10,000+ Elite Attendees
            </h3>
            <p className="text-xs text-[#D1C2A5] leading-relaxed">
              Title Presenting Sponsorship, VIP Cabana Activations, Beverage Alliances, and Food Pavilions available for Safed Sheri 2026 in Rajkot.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full md:w-auto">
            <button
              onClick={() => {
                garbaAudio.playDhol();
                onOpenSponsorModal?.();
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-wider uppercase hover:scale-105 transition shadow-lg shadow-[#D99427]/30 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-[#2D1F0E]" />
              <span>Inquire For Brand Sponsorship →</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
