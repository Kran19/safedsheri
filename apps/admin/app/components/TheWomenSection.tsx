"use client";

import React from 'react';

const organizers = [
  {
    name: "VIMMI",
    role: "FOUNDER & VISIONARY",
  },
  {
    name: "DELISHA",
    role: "CREATIVE DIRECTOR",
  },
  {
    name: "PRIYANKA",
    role: "EXPERIENCE CURATOR",
  }
];

export default function TheWomenSection() {
  return (
    <section 
      id="the-women" 
      className="relative w-full min-h-[100dvh] py-24 bg-[#FFFDF9] border-t border-[#EAD9B8] flex flex-col items-center justify-center z-10 box-border px-6"
    >
      {/* Background Texture */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-overlay flex items-center justify-center">
        <div className="absolute w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_#FFF9EE_0%,_#FFFDF9_60%,_transparent_100%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-6xl mx-auto">
        
        {/* Header Block */}
        <div className="w-full text-center pointer-events-none space-y-8 mb-20 z-20 relative">
          <div className="space-y-3">
            <span className="text-[11px] font-bold tracking-[0.3em] text-[#8C6019] uppercase block">Chapter V</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#2D1F0E]">
              The Women Behind The Celebration
            </h2>
          </div>
          
          {/* Main Statement */}
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-[#2D1F0E] leading-[1.2] italic tracking-tight">
            THREE WOMEN.<br/>ONE VISION.<br/><span className="text-[#8C6019]">A CELEBRATION IN WHITE.</span>
          </h3>
        </div>
        
        {/* Organizers Cards */}
        <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-center justify-center w-full max-w-4xl mx-auto">
          {organizers.map((org, i) => (
            <div 
              key={i} 
              className="flex-1 w-full max-w-[300px] text-center bg-white px-8 py-8 rounded-3xl border border-[#EAD9B8] shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-[#D99427]"
            >
              <h4 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F0E] mb-2 tracking-tight">{org.name}</h4>
              <div className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-[#8C6019] uppercase">{org.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
