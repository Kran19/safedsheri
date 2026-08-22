"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";

const TOTAL_FRAMES = 300;
const getFrameUrl = (index: number) => {
  const padded = String(index + 1).padStart(4, "0");
  return `/frames/tigress/frame_${padded}.jpg`;
};

export default function CinematicTigressIntro({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const introOverlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightDissolveRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const isMobile = window.innerWidth < 768;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // ─── LENIS BUTTER SMOOTH SCROLL (Desktop Only) ───
    let lenis: any = null;
    if (!isTouch && !isMobile) {
      const LenisModule = require("lenis");
      const LenisClass = LenisModule.default || LenisModule;
      lenis = new LenisClass({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        infinite: false,
      });

      lenis.on("scroll", ScrollTrigger.update);

      gsap.ticker.add((time: number) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current || !introOverlayRef.current) return;

    const ctx2d = canvas.getContext("2d", { alpha: false });
    if (!ctx2d) return;

    // Preloaded Image array
    const images: HTMLImageElement[] = [];

    // Fixed internal resolution for the frame sequence
    const CANVAS_WIDTH = 1920;
    const CANVAS_HEIGHT = 1080;

    // Simple renderer - CSS object-fit handles the responsive cropping
    const renderFrame = (img: HTMLImageElement) => {
      if (!canvas || !ctx2d || !img.complete || img.naturalWidth === 0) return;

      if (canvas.width !== CANVAS_WIDTH) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
      }

      // Draw the full image; the CSS object-cover class will scale it to the screen
      ctx2d.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    // On mobile, only preload every 2nd frame to save memory
    const frameStep = isMobile ? 2 : 1;
    const effectiveFrames = isMobile ? Math.ceil(TOTAL_FRAMES / frameStep) : TOTAL_FRAMES;

    for (let i = 0; i < TOTAL_FRAMES; i += frameStep) {
      const img = new Image();
      img.decoding = "async";
      img.src = getFrameUrl(i);
      img.onload = () => {
        if (images.indexOf(img) === 0) renderFrame(img);
      };
      images.push(img);
    }

    // ─── GSAP TIMELINE ───
    const frameObj = { frame: 0 };
    let lastRenderedFrame = -1;

    const gsapCtx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: isMobile ? "+=150%" : "+=260%",
          pin: true,
          pinSpacing: true,
          // Mobile: lower scrub for responsive touch, Desktop: smooth lerp
          scrub: isTouch ? 0.5 : 0.8,
          invalidateOnRefresh: true,
          refreshPriority: 12,
          anticipatePin: 1,
        },
      });

      // 1. Scrub canvas frames
      tl.to(frameObj, {
        frame: effectiveFrames - 1,
        ease: "none",
        duration: 1,
        onUpdate: () => {
          const currentIdx = Math.min(
            Math.max(Math.round(frameObj.frame), 0),
            effectiveFrames - 1
          );
          if (currentIdx !== lastRenderedFrame) {
            const img = images[currentIdx];
            if (img && img.complete) {
              renderFrame(img);
              lastRenderedFrame = currentIdx;
            }
          }
        },
      }, 0);

      // 2. Fade out scroll prompt
      tl.to(
        indicatorRef.current,
        {
          opacity: 0,
          y: 20,
          duration: 0.08,
          ease: "power2.out",
        },
        0
      );

      // 3. Dissolve into golden ivory light (78% -> 94%)
      tl.to(
        lightDissolveRef.current,
        {
          opacity: 1,
          duration: 0.16,
          ease: "power2.inOut",
        },
        0.78
      );

      // 4. Fade out overlay to seamlessly unveil Hero underneath (88% -> 100%)
      tl.to(
        introOverlayRef.current,
        {
          opacity: 0,
          duration: 0.12,
          ease: "power2.out",
          onComplete: () => {
            if (introOverlayRef.current) {
              introOverlayRef.current.style.pointerEvents = "none";
            }
          },
          onReverseComplete: () => {
            if (introOverlayRef.current) {
              introOverlayRef.current.style.pointerEvents = "auto";
            }
          },
        },
        0.88
      );
    }, containerRef);

    // Resize handler
    const handleResize = () => {
      const currentIdx = Math.min(
        Math.max(Math.round(frameObj.frame), 0),
        effectiveFrames - 1
      );
      const img = images[currentIdx] || images[0];
      if (img && img.complete) {
        renderFrame(img);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      gsapCtx.revert();
      if (lenis) lenis.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Pristine Hero Section Rendered Underneath */}
      <div className="relative z-10 w-full min-h-[100dvh]">
        {children}
      </div>

      {/* Full-viewport Pinned Canvas Parallax Frame Sequence Overlay */}
      <div
        ref={introOverlayRef}
        className="absolute inset-0 z-30 w-full h-full bg-[#FFFDF9] overflow-hidden select-none"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          style={{ display: "block" }}
        />

        {/* Subtle Ambient Golden Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_60%,_rgba(255,253,249,0.2)_85%,_rgba(255,253,249,0.5)_100%)]" />

        {/* Ivory & Gold Dissolve Curtain */}
        <div
          ref={lightDissolveRef}
          className="absolute inset-0 bg-gradient-to-b from-[#FFFDF9]/95 via-[#FFF8EC] to-[#FFFDF9] opacity-0 pointer-events-none z-20"
        />

        {/* Minimal Scroll Indicator */}
        <div
          ref={indicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30 pointer-events-none bg-black/30 backdrop-blur-md px-5 py-2 rounded-full border border-white/30 shadow-lg"
        >
          <span className="text-[10px] md:text-[11px] font-mono font-bold tracking-[0.3em] text-white drop-shadow-sm uppercase">
            Scroll To Enter
          </span>
          <div className="w-4 h-4 flex items-center justify-center text-[#F6C85F] animate-bounce">
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
