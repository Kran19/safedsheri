"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const TOTAL_FRAMES = 240;
const getFrameUrl = (index: number) => {
  const padded = String(index + 1).padStart(4, "0");
  return `/frames/tigress/frame_${padded}.jpg`;
};

const PARALLAX_LAYERS = [
  { id: 7, name: "Backdrop", z: -600, speed: 0.05, hoverType: "none" },
  { id: 9, name: "Deep Architecture", z: -450, speed: 0.1, hoverType: "none" },
  { id: 4, name: "Crowd / Dancers", z: -300, speed: 0.15, hoverType: "wave" },
  { id: 8, name: "Archway", z: -150, speed: 0.2, hoverType: "none" },
  { id: 5, name: "White Tigress", z: 0, speed: 0.35, hoverType: "scaleFloat" },
  { id: 6, name: "Woman", z: 100, speed: 0.45, hoverType: "glowElevate" },
  { id: 1, name: "Foreground 1", z: 300, speed: 0.6, hoverType: "glow" },
  { id: 2, name: "Foreground 2", z: 300, speed: 0.6, hoverType: "glow" },
  { id: 3, name: "Foreground 3", z: 300, speed: 0.6, hoverType: "glow" },
];

export default function CinematicScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tigressRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    const isMobile = window.innerWidth < 768;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // --- CANVAS SETUP ---
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx2d = canvas.getContext("2d", { alpha: false });
    if (!ctx2d) return;

    // Preload video frames
    let loadedCount = 0;
    const effectiveFrames = isMobile ? Math.floor(TOTAL_FRAMES / 2) : TOTAL_FRAMES;
    const images: HTMLImageElement[] = [];

    const renderFrame = (img: HTMLImageElement) => {
      if (!canvas) return;
      
      const targetRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > targetRatio) {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      } else {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      }

      ctx2d.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    for (let i = 0; i < effectiveFrames; i++) {
      const realIndex = isMobile ? i * 2 : i;
      const img = new Image();
      img.src = getFrameUrl(realIndex);
      img.onload = () => {
        loadedCount++;
        if (loadedCount === 1) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          renderFrame(img);
        }
      };
      images.push(img);
    }

    // Set initial 3D positions for parallax layers
    PARALLAX_LAYERS.forEach((config, i) => {
      if (layersRef.current[i]) {
        gsap.set(layersRef.current[i], {
          z: config.z,
          y: isMobile ? 0 : 50,
        });
      }
    });

    // --- MOUSE PARALLAX (Desktop) ---
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile || !parallaxRef.current) return;
      
      const { innerWidth, innerHeight } = window;
      const { clientX, clientY } = e;
      const xPos = (clientX / innerWidth - 0.5) * 2;
      const yPos = (clientY / innerHeight - 0.5) * 2;

      // Global container tilt
      gsap.to(parallaxRef.current, {
        rotateY: xPos * 3, // ±3deg
        rotateX: yPos * -2, // ±2deg
        duration: 1,
        ease: "power2.out",
      });

      // Subtle individual layer shifts based on Z-depth
      PARALLAX_LAYERS.forEach((config, i) => {
        const el = layersRef.current[i];
        if (el) {
          gsap.to(el, {
            x: xPos * config.z * -0.02, 
            y: yPos * config.z * -0.02,
            duration: 1.5,
            ease: "power2.out",
          });
        }
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // --- MASTER TIMELINE ---
    const frameObj = { frame: 0 };
    let lastRenderedFrame = -1;

    const exactCtx = gsap.context(() => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=400%", // 4 screens of scrolling for a cinematic feel
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        }
      });

      // 0-40%: Parallax 3D movement scrubs
      PARALLAX_LAYERS.forEach((config, i) => {
        const el = layersRef.current[i];
        if (el) {
          tl.to(el, {
            y: "+=200", // Relative movement
            scale: 1 + (config.speed * 0.1),
            duration: 40,
            ease: "none",
          }, 0);
        }
      });

      // 25-45%: Parallax fades out, Video fades in
      tl.to(parallaxRef.current, {
        scale: 1.1,
        opacity: 0,
        filter: "blur(5px)",
        duration: 20,
        ease: "power1.inOut",
      }, 25);

      tl.fromTo(tigressRef.current, 
        { opacity: 0, scale: 0.95 }, 
        { opacity: 1, scale: 1, duration: 20, ease: "power1.inOut" }, 
      25);

      // 45-90%: Tigress Video scrubs
      tl.to(frameObj, {
        frame: effectiveFrames - 1,
        ease: "none",
        duration: 45, // Plays through 45% of the scroll
        onUpdate: () => {
          const currentIdx = Math.min(Math.max(Math.round(frameObj.frame), 0), effectiveFrames - 1);
          if (currentIdx !== lastRenderedFrame) {
            const img = images[currentIdx];
            if (img && img.complete) {
              renderFrame(img);
              lastRenderedFrame = currentIdx;
            }
          }
        },
      }, 45);

      // 90-100%: Hold the final video frame briefly before unpinning
      tl.to({}, { duration: 10 }, 90);

    }, containerRef);

    const handleResize = () => {
      const currentIdx = Math.min(Math.max(Math.round(frameObj.frame), 0), effectiveFrames - 1);
      const img = images[currentIdx] || images[0];
      if (img && img.complete) renderFrame(img);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      exactCtx.revert();
    };
  }, []);

  const handleMouseEnter = (type: string, index: number) => {
    const el = layersRef.current[index];
    if (!el) return;

    if (type === "scaleFloat") {
      gsap.to(el, { scale: 1.05, y: "-=20", duration: 0.5, ease: "power2.out" });
    } else if (type === "glowElevate") {
      gsap.to(el, { scale: 1.03, y: "-=15", filter: "drop-shadow(0 0 15px rgba(255,215,0,0.4))", duration: 0.5, ease: "power2.out" });
    } else if (type === "wave") {
      gsap.to(el, { y: "-=10", rotation: 1, duration: 0.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
    } else if (type === "glow") {
      gsap.to(el, { filter: "brightness(1.2) drop-shadow(0 0 10px rgba(255,215,0,0.6))", scale: 1.02, duration: 0.4 });
    }
  };

  const handleMouseLeave = (type: string, index: number) => {
    const el = layersRef.current[index];
    if (!el) return;

    if (type === "scaleFloat") {
      gsap.to(el, { scale: 1, y: "+=20", duration: 0.5, ease: "power2.out" });
    } else if (type === "glowElevate") {
      gsap.to(el, { scale: 1, y: "+=15", filter: "drop-shadow(0 0 0px rgba(255,215,0,0))", duration: 0.5, ease: "power2.out" });
    } else if (type === "wave") {
      gsap.killTweensOf(el);
      gsap.to(el, { y: "+=10", rotation: 0, duration: 0.4, ease: "power2.out" });
    } else if (type === "glow") {
      gsap.to(el, { filter: "brightness(1) drop-shadow(0 0 0px rgba(255,215,0,0))", scale: 1, duration: 0.4 });
    }
  };

  return (
    <section ref={containerRef} className="relative w-full h-[100dvh] overflow-hidden bg-[#FFFDF9] z-40">
      
      {/* PHASE 3 & 4: FIGMA 3D PARALLAX COMPOSITION */}
      <div 
        ref={parallaxRef} 
        className="absolute inset-0 w-full h-full flex items-center justify-center opacity-100 z-10"
        style={{ perspective: "1500px" }}
      >
        <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] aspect-video" style={{ transformStyle: 'preserve-3d' }}>
          {PARALLAX_LAYERS.map((config, i) => (
            <img
              key={config.id}
              ref={(el) => { layersRef.current[i] = el; }}
              src={`/images/interactive-parallax/1 (${config.id}).png`}
              alt={config.name}
              className={`absolute inset-0 w-full h-full object-cover will-change-transform ${config.hoverType !== 'none' ? 'cursor-pointer' : 'pointer-events-none'}`}
              style={{ transformStyle: 'preserve-3d' }}
              onMouseEnter={() => handleMouseEnter(config.hoverType, i)}
              onMouseLeave={() => handleMouseLeave(config.hoverType, i)}
            />
          ))}
        </div>
      </div>

      {/* PHASE 1 & 2: WHITE TIGRESS VIDEO */}
      <div 
        ref={tigressRef}
        className="absolute inset-0 w-full h-full z-20 bg-[#FFFDF9] origin-center will-change-transform opacity-0 pointer-events-none"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />
      </div>

    </section>
  );
}
