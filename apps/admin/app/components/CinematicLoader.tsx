"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import LogoSlot from "./LogoSlot";

export default function CinematicLoader({ children }: { children: React.ReactNode }) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const darkOverlayRef = useRef<HTMLDivElement>(null);

  const [isLoaderActive, setIsLoaderActive] = useState(true);

  // Configuration for development (can be toggled)
  const SHOW_LOADER = true;
  const PLAY_ONCE_PER_SESSION = false; // Temporarily false so you can test it on refresh

  useLayoutEffect(() => {
    if (!SHOW_LOADER) {
      setIsLoaderActive(false);
      return;
    }

    // SSR Safe Session Storage Check
    if (typeof window !== "undefined" && PLAY_ONCE_PER_SESSION) {
      const hasPlayed = sessionStorage.getItem("safedsheri_loader_played");
      if (hasPlayed) {
        setIsLoaderActive(false);
        // Force the hero elements to their final state immediately
        gsap.set(".hero-logo-slot", { opacity: 1, y: 0 });
        gsap.set(".hero-pill", { opacity: 1, y: 0 });
        gsap.set(".hero-heading-inner", { y: "0%" });
        gsap.set(".hero-subtitle", { opacity: 1, y: 0 });
        gsap.set(".hero-desc", { opacity: 1, y: 0 });
        gsap.set(".hero-cta", { opacity: 1, y: 0 });
        gsap.set(".hero-grid", { opacity: 1, y: 0 });
        return;
      }
    }

    const ctx = gsap.context(() => {
      // Set initial states for the Hero elements (hidden before loader finishes)
      gsap.set(".hero-logo-slot", { opacity: 0, y: 20 });
      gsap.set(".hero-pill", { opacity: 0, y: 20 });
      gsap.set(".hero-heading-inner", { y: "110%" });
      gsap.set(".hero-subtitle", { opacity: 0, y: 20 });
      gsap.set(".hero-desc", { opacity: 0, y: 20 });
      gsap.set(".hero-cta", { opacity: 0, y: 20 });
      gsap.set(".hero-grid", { opacity: 0, y: 20 });
      
      // Initial state of the loader components
      gsap.set(logoRef.current, { opacity: 0, scale: 0.9, filter: "blur(10px)" });
      gsap.set(overlayRef.current, { clipPath: "circle(150% at 50% 50%)" });

      const tl = gsap.timeline({
        onComplete: () => {
          if (typeof window !== "undefined" && PLAY_ONCE_PER_SESSION) {
            sessionStorage.setItem("safedsheri_loader_played", "true");
          }
          setIsLoaderActive(false);
        },
        defaults: { ease: "power3.inOut" }
      });

      // PHASE 1 & 2 - Loader Establishes & Logo Reveals
      tl.to(logoRef.current, {
        opacity: 1,
        scale: 1.5,
        filter: "blur(0px)",
        duration: 2.2,
        ease: "power2.out",
        delay: 0.2
      });

      // PHASE 3 - Logo Hold
      tl.to(logoRef.current, {
        opacity: 1,
        duration: 0.6
      });

      // PHASE 4 - Ivory Transition
      // We shrink the entire loader overlay into a circle to reveal the Hero underneath
      tl.to(overlayRef.current, {
        clipPath: "circle(0% at 50% 50%)",
        duration: 1.4,
      }, "+=0.2");

      // Fade out the loader logo as the loader shrinks away
      tl.to(logoRef.current, {
        opacity: 0,
        scale: 1.6,
        duration: 0.6
      }, "<");

      // PHASE 6 - Hero Reveal (Editorial Sequence)
      // The overlay is fading out, start revealing the hero elements
      tl.to(".hero-logo-slot", { opacity: 1, y: 0, duration: 0.8 }, "-=0.4");
      tl.to(".hero-pill", { opacity: 1, y: 0, duration: 0.8 }, "-=0.6");
      
      // Editorial text reveal (translateY from 100% to 0)
      tl.to(".hero-heading-inner", { y: "0%", duration: 1, ease: "power4.out" }, "-=0.6");
      
      tl.to(".hero-subtitle", { opacity: 1, y: 0, duration: 0.8 }, "-=0.6");
      tl.to(".hero-desc", { opacity: 1, y: 0, duration: 0.8 }, "-=0.6");
      tl.to(".hero-cta", { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, "-=0.6");
      tl.to(".hero-grid", { opacity: 1, y: 0, duration: 0.8 }, "-=0.6");

    }, loaderRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={loaderRef} className="relative w-full">
      {/* The existing website content (Hero) is rendered here */}
      {children}

      {/* Full-screen fixed loader overlay */}
      {isLoaderActive && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FFFDF9] overflow-hidden pointer-events-auto"
        >
          {/* Loader Logo */}
          <div 
            ref={logoRef}
            className="relative z-10 flex items-center justify-center"
          >
            <LogoSlot size="hero" />
          </div>
        </div>
      )}
    </div>
  );
}
