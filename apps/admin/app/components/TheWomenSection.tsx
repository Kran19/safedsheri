"use client";

import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const organizers = [
  {
    name: "VIMMI",
    role: "FOUNDER & VISIONARY",
    description: "Responsible for the vision and overall direction of SafeD Sheri.",
    image: "/images/04/Vimmi.jpg"
  },
  {
    name: "DELISHA",
    role: "CREATIVE DIRECTOR",
    description: "Responsible for the creative identity, aesthetics and cultural expression.",
    image: "/images/04/Delisha.jpg"
  },
  {
    name: "PRIYANKA",
    role: "EXPERIENCE CURATOR",
    description: "Responsible for creating the guest experience and bringing the celebration to life.",
    image: "/images/04/Priyanka.jpg"
  }
];

export default function TheWomenSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Set initial states
      gsap.set('.image-0', { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, y: 0 });
      gsap.set('.image-1', { scale: 1.08, y: 30 });
      gsap.set('.image-2', { scale: 1.08, y: 30 });
      gsap.set('.tigress-bg-video', { opacity: 0 });

      const isMobile = window.innerWidth < 768;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: isMobile ? "+=130%" : "+=260%",
          scrub: isMobile ? 0.7 : 1,
          pin: true,
          refreshPriority: 8
        }
      });

      // 0-20% Hold State 1
      tl.to({}, { duration: 1 });

      // 20-45% Transition 1: AAROHI -> ISHITA
      tl.to('.image-0', {
        clipPath: 'inset(0% 0% 100% 0%)',
        scale: 0.95,
        y: -30,
        rotationZ: -1,
        opacity: 0.5,
        duration: 1.5,
        ease: "power2.inOut"
      }, 'trans1')
      .to('.image-1', {
        scale: 1,
        y: 0,
        rotationZ: 0,
        duration: 1.5,
        ease: "power2.inOut"
      }, 'trans1')
      // Text out (Aarohi)
      .to('.name-0', { opacity: 0, x: -30, duration: 0.6, ease: "power2.inOut" }, 'trans1')
      .to('.desc-0', { opacity: 0, x: 30, duration: 0.6, ease: "power2.inOut" }, 'trans1')
      // Text in (Ishita)
      .to('.name-1', { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }, 'trans1+=0.7')
      .to('.desc-1', { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }, 'trans1+=0.7');

      // 45-70% Hold State 2
      tl.to({}, { duration: 1 });

      // 70-90% Transition 2: ISHITA -> MEERA
      tl.to('.image-1', {
        clipPath: 'inset(0% 0% 100% 0%)',
        scale: 0.95,
        y: -30,
        rotationZ: -1,
        opacity: 0.5,
        duration: 1.5,
        ease: "power2.inOut"
      }, 'trans2')
      .to('.image-2', {
        scale: 1,
        y: 0,
        rotationZ: 0,
        duration: 1.5,
        ease: "power2.inOut"
      }, 'trans2')
      // Text out (Ishita)
      .to('.name-1', { opacity: 0, x: -30, duration: 0.6, ease: "power2.inOut" }, 'trans2')
      .to('.desc-1', { opacity: 0, x: 30, duration: 0.6, ease: "power2.inOut" }, 'trans2')
      // Text in (Meera)
      .to('.name-2', { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }, 'trans2+=0.7')
      .to('.desc-2', { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }, 'trans2+=0.7');

      // 90-100% Final Hold and Statement (Tigress Video reveals here!)
      tl.to('.content-wrapper', {
        opacity: 0,
        scale: 0.95,
        duration: 1.5,
        ease: "power2.inOut"
      }, 'final')
      .to('.tigress-bg-video', {
        opacity: 1,
        duration: 1.5,
        ease: "power2.out"
      }, 'final')
      .fromTo('.final-statement', {
        opacity: 0,
        y: 30,
      }, {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: "power2.out"
      }, 'final')
      .to({}, { duration: 1 });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      id="the-women" 
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-[#FFFDF9] border-t border-[#EAD9B8] overflow-hidden flex flex-col items-center justify-center z-10 box-border"
    >
      {/* Background Texture / Fabric for Photo Cards */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-overlay flex items-center justify-center">
        <div className="absolute w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_#FFF9EE_0%,_#FFFDF9_60%,_transparent_100%)]"></div>
      </div>

      {/* Background Ambient Tigress Video — ONLY fades in with the final text statement */}
      <div className="tigress-bg-video absolute inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          src="/videos/white-tigress-intro.mp4"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60 mix-blend-multiply"
        />
        {/* Soft Radial & Linear Ivory Gradient Veils to ensure rich contrast */}
        <div className="absolute inset-0 bg-[#FFFDF9]/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#FFFDF9_85%)]" />
      </div>

      {/* CONTENT WRAPPER (Fades out at the end) */}
      <div className="content-wrapper relative w-full h-full flex flex-col items-center justify-center z-20">
        
        {/* Header (Normal Flow) */}
        <div className="w-full text-center pointer-events-none px-6 mb-[4vh] md:mb-[6vh] space-y-2">
          <span className="text-[10px] font-bold tracking-[0.3em] text-[#8C6019] uppercase block">Chapter IV</span>
          <h2 className="text-3xl font-serif font-bold text-[#2D1F0E]">
            The Women Behind<br/>The Celebration
          </h2>
        </div>

        {/* Main Editorial Composition */}
        <div className="relative w-full max-w-6xl mx-auto h-[60vh] md:h-[55vh] flex flex-col md:flex-row items-center justify-between px-6 md:px-12">
          
          {/* LEFT WRAPPER: Names */}
          <div className="relative w-full md:flex-1 h-[40px] md:h-[100px] flex items-center justify-center md:justify-end mb-4 md:mb-0 md:pr-10 lg:pr-14 z-30">
            {organizers.map((org, i) => (
              <div 
                key={i} 
                className={`name-${i} absolute w-full text-center md:text-right ${i === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
              >
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#2D1F0E] tracking-tight whitespace-nowrap">{org.name}</h3>
              </div>
            ))}
          </div>

          {/* CENTER WRAPPER: Portrait Frame */}
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px] h-[40vh] md:h-full flex-shrink-0 z-10 mx-auto">
            {/* STATIC FRAME */}
            <div className="absolute inset-0 bg-[#FFFDF9] border-[1.5px] border-[#EAD9B8] rounded-[1.5rem] shadow-2xl p-2 md:p-3 overflow-hidden">
               <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ perspective: '2000px' }}>
                  {organizers.map((org, i) => (
                    <img 
                      key={i} 
                      src={org.image} 
                      className={`image-${i} absolute inset-0 w-full h-full object-cover origin-center`} 
                      alt={org.name} 
                      style={{ zIndex: organizers.length - i }}
                    />
                  ))}
               </div>
            </div>
          </div>

          {/* RIGHT WRAPPER: Info */}
          <div className="relative w-full md:flex-1 h-[80px] md:h-[150px] flex items-center justify-center md:justify-start mt-4 md:mt-0 md:pl-10 lg:pl-14 z-30">
            {organizers.map((org, i) => (
              <div 
                key={i} 
                className={`desc-${i} absolute w-full text-center md:text-left ${i === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
              >
                <div className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-[#8C6019] uppercase mb-2 md:mb-3">{org.role}</div>
                <p className="text-[12px] md:text-sm text-[#5C4E40] leading-relaxed font-medium max-w-[260px] mx-auto md:mx-0">{org.description}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* FINAL STATEMENT & ORGANIZERS */}
      <div className="final-statement absolute inset-0 w-full h-full flex flex-col items-center justify-center z-40 opacity-0 pointer-events-none px-6">
        <h3 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-[#2D1F0E] leading-snug italic text-center mb-10 tracking-tight drop-shadow-sm">
          THREE WOMEN.<br/>ONE VISION.<br/><span className="text-[#8C6019]">A CELEBRATION IN WHITE.</span>
        </h3>
        
        <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-center justify-center">
          {organizers.map((org, i) => (
            <div 
              key={i} 
              className="text-center bg-white/35 hover:bg-white/55 backdrop-blur-xl px-7 py-5 rounded-2xl border border-white/70 shadow-[0_8px_32px_rgba(217,148,39,0.08),_inset_0_1px_1px_rgba(255,255,255,0.8)] min-w-[210px] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgba(217,148,39,0.15)]"
            >
              <h4 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F0E] mb-1.5 tracking-tight">{org.name}</h4>
              <div className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-[#8C6019] uppercase">{org.role}</div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
