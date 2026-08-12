'use client';

import React from 'react';

interface WhiteTigressMotifProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export default function WhiteTigressMotif({
  className = '',
  size = 120,
  glow = true,
}: WhiteTigressMotifProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Ambient Radial Aura */}
      {glow && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/10 via-yellow-400/20 to-amber-600/5 blur-2xl animate-pulse-glow"></div>
      )}

      {/* Elegant Architectural SVG Symbol of White Tigress & Gold Geometry */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-700 hover:scale-105"
      >
        {/* Outer Circular Celestial Halo */}
        <circle cx="100" cy="100" r="94" stroke="url(#goldHaloGrad)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
        <circle cx="100" cy="100" r="86" stroke="#D4AF37" strokeWidth="0.8" opacity="0.4" />

        {/* Geometric Tiger Stripe Contour Lines */}
        <path
          d="M 50,65 Q 100,35 150,65 Q 100,50 50,65 Z"
          fill="url(#goldStripeGrad)"
          opacity="0.85"
        />
        <path
          d="M 60,90 Q 100,68 140,90 Q 100,78 60,90 Z"
          fill="url(#goldStripeGrad)"
          opacity="0.9"
        />
        <path
          d="M 70,115 Q 100,98 130,115 Q 100,105 70,115 Z"
          fill="url(#goldStripeGrad)"
          opacity="0.8"
        />

        {/* Quiet Power Tigress Eye Contour Highlights */}
        {/* Left Eye Glint */}
        <ellipse cx="78" cy="85" rx="7" ry="3.5" fill="#FAF8F5" opacity="0.9" />
        <circle cx="78" cy="85" r="1.5" fill="#D4AF37" />

        {/* Right Eye Glint */}
        <ellipse cx="122" cy="85" rx="7" ry="3.5" fill="#FAF8F5" opacity="0.9" />
        <circle cx="122" cy="85" r="1.5" fill="#D4AF37" />

        {/* Central Devanagari Geometric Crown Node */}
        <polygon points="100,45 105,58 100,54 95,58" fill="#D4AF37" />
        <circle cx="100" cy="140" r="3" fill="#D4AF37" />

        {/* Radiant Lines */}
        <line x1="100" y1="148" x2="100" y2="168" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

        {/* SVG Gradients */}
        <defs>
          <linearGradient id="goldHaloGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F3E5AB" />
            <stop offset="0.5" stopColor="#D4AF37" />
            <stop offset="1" stopColor="#997A15" />
          </linearGradient>

          <linearGradient id="goldStripeGrad" x1="50" y1="35" x2="150" y2="115" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FAF8F5" />
            <stop offset="0.6" stopColor="#D4AF37" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
