'use client';

import { useState } from 'react';

interface LogoSlotProps {
  className?: string;
  logoPath?: string;
}

export default function LogoSlot({
  className = '',
  logoPath = '/images/safed-sheri-logo.png',
}: LogoSlotProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative flex items-center ${className}`}>
      {!hasError ? (
        <div className="relative h-10 md:h-12 w-auto flex items-center">
          <img
            src={logoPath}
            alt="Safed Sheri 2026"
            className="h-10 md:h-12 w-auto object-contain rounded-md filter drop-shadow-[0_2px_8px_rgba(217,119,6,0.18)] transition-transform duration-300 hover:scale-105"
            onError={() => setHasError(true)}
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-[1px] shadow-lg shadow-amber-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center font-cinzel font-bold text-amber-700 text-xs">
            SS
          </div>
        </div>
      )}
    </div>
  );
}
