'use client';

import { useState } from 'react';
import Image from 'next/image';

interface LogoSlotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  showDate?: boolean;
  subtitle?: string;
}

export default function LogoSlot({
  className = '',
  size = 'md',
  showText = false,
  showDate = false,
  subtitle,
}: LogoSlotProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 sm:h-9 sm:w-9',
    md: 'h-11 w-11 sm:h-12 sm:w-12',
    lg: 'h-14 w-14 sm:h-16 sm:w-16',
    hero: 'h-24 w-24 sm:h-28 sm:w-28 md:h-36 md:w-36',
  };

  return (
    <div className={`inline-flex items-center space-x-2 sm:space-x-2.5 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#FFF9EE] to-[#F5EFEB] p-1 shadow-md border border-[#EAD9B8]`}>
        {!hasError ? (
          <Image
            src="/images/safed-sheri-logo.png"
            alt="सफ़ेद Sheri"
            fill
            sizes="(max-width: 768px) 100vw, 150px"
            className="object-contain rounded-full filter drop-shadow-[0_2px_6px_rgba(217,148,39,0.25)] transition-transform duration-300 hover:scale-105"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#F6C85F] to-[#D99427] flex items-center justify-center text-[#2D1F0E] font-serif font-bold text-xs">
            SS
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-serif font-bold text-[#2D1F0E] tracking-[0.16em] text-xs sm:text-sm leading-tight whitespace-nowrap">
            SAFED <span className="text-[#D99427]">SHERI</span>
          </span>
          {showDate && (
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] font-semibold text-[#8C6019] uppercase">
              {subtitle || '09 OCTOBER 2026'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
