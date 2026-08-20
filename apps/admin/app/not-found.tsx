'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#FDFBF7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D99427]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className={`relative z-10 flex flex-col items-center text-center transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        <h1 className="text-7xl md:text-9xl font-serif text-[#D99427] mb-4 drop-shadow-[0_0_15px_rgba(217,148,39,0.3)]">404</h1>
        <h2 className="text-2xl md:text-4xl font-semibold tracking-widest uppercase mb-8 text-[#EAD9B8]">Page Not Found</h2>
        
        <div className="relative w-full max-w-lg aspect-square md:aspect-video rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(217,148,39,0.15)] mb-10 border border-[#D99427]/30 group">
          <Image 
            src="/safedsheri/images/developer-coding.jpg" 
            alt="Developer coding" 
            fill 
            className="object-cover transition-transform duration-[10s] ease-in-out group-hover:scale-110"
            priority
          />
          {/* Scanning Line Animation overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D99427]/20 to-transparent h-[10%] animate-[scan_3s_ease-in-out_infinite]" />
        </div>

        <p className="text-[#A3927B] max-w-md text-sm md:text-base leading-relaxed mb-10">
          Our developers are deep in the code, building something extraordinary. 
          The page you are looking for has been moved or doesn't exist yet.
        </p>

        <a 
          href="/safedsheri" 
          className="px-8 py-3 bg-transparent border-2 border-[#D99427] text-[#D99427] rounded-full uppercase tracking-widest text-xs font-semibold hover:bg-[#D99427] hover:text-[#0F0F0F] transition-all duration-300 shadow-[0_0_15px_rgba(217,148,39,0.2)] hover:shadow-[0_0_30px_rgba(217,148,39,0.4)]"
        >
          Return to home
        </a>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: -10%; }
          50% { top: 100%; }
          100% { top: -10%; }
        }
      `}</style>
    </div>
  );
}
