'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const TOTAL_FRAMES = 330;

// Global Image Cache outside React component lifecycles to prevent re-render cancellations
const globalImages: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
let globalLoadedCount = 0;
let isPreloadStarted = false;

function preloadAllFrames(onProgress?: (loaded: number) => void) {
  if (isPreloadStarted) return;
  isPreloadStarted = true;

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    const frameNum = (i + 1).toString().padStart(3, '0');
    img.src = `/frames/${frameNum}.png`;

    img.onload = () => {
      globalImages[i] = img;
      globalLoadedCount++;
      if (onProgress) onProgress(globalLoadedCount);
    };

    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.src = `http://localhost:4000/api/v1/content/frames/${frameNum}.png`;
      fallbackImg.onload = () => {
        globalImages[i] = fallbackImg;
        globalLoadedCount++;
        if (onProgress) onProgress(globalLoadedCount);
      };
      fallbackImg.onerror = () => {
        globalLoadedCount++;
        if (onProgress) onProgress(globalLoadedCount);
      };
    };
  }
}

interface FrameCanvasEngineProps {
  onPreloadProgress?: (loaded: number, total: number, isComplete: boolean) => void;
}

export default function FrameCanvasEngine({ onPreloadProgress }: FrameCanvasEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ frame: number; targetFrame: number }>({ frame: 0, targetFrame: 0 });
  const lastDrawnImgRef = useRef<HTMLImageElement | null>(null);

  // Mouse Interactive State for ivress.co.jp style effect
  const mouseRef = useRef<{ x: number; y: number; active: boolean; radius: number }>({
    x: -1000,
    y: -1000,
    active: false,
    radius: 140,
  });

  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(stateRef.current.frame)));
    let img = globalImages[frameIndex];

    if (!img || !img.complete || img.naturalWidth === 0) {
      if (lastDrawnImgRef.current && lastDrawnImgRef.current.complete) {
        img = lastDrawnImgRef.current;
      } else {
        for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
          if (globalImages[frameIndex - offset]?.complete) {
            img = globalImages[frameIndex - offset];
            break;
          }
          if (globalImages[frameIndex + offset]?.complete) {
            img = globalImages[frameIndex + offset];
            break;
          }
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;
    lastDrawnImgRef.current = img;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetWidth = Math.floor(width * dpr);
    const targetHeight = Math.floor(height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Object-fit cover scaling
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let drawW = width;
    let drawH = height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawH = width / imgRatio;
      offsetY = (height - drawH) / 2;
    } else {
      drawW = height * imgRatio;
      offsetX = (width - drawW) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    // DYNAMIC FLUID MOUSE HOVER DISTORTION AURA (brand.ivress.co.jp style)
    if (mouseRef.current.active) {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const rad = mouseRef.current.radius;

      ctx.save();
      // Warm Pearl Gold Fluid Radial Glow Aura around cursor
      const gradient = ctx.createRadialGradient(mx, my, 0, mx, my, rad);
      gradient.addColorStop(0, 'rgba(217, 119, 6, 0.28)');
      gradient.addColorStop(0.4, 'rgba(251, 191, 36, 0.12)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mx, my, rad, 0, Math.PI * 2);
      ctx.fill();

      // Interactive Shockwave Ring
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx, my, rad * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    preloadAllFrames((count) => {
      if (onPreloadProgress) {
        onPreloadProgress(count, TOTAL_FRAMES, count >= TOTAL_FRAMES);
      }
      renderFrame();
    });

    renderFrame();

    // 1 frame per 2 seconds (2000ms) Auto-Play Loop & Smooth Interpolation
    let animFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTime;

      if (delta >= 2000) {
        stateRef.current.targetFrame = (stateRef.current.targetFrame + 1) % TOTAL_FRAMES;
        lastTime = now;
      }

      const diff = stateRef.current.targetFrame - stateRef.current.frame;
      if (Math.abs(diff) > 0.01) {
        stateRef.current.frame += diff * 0.02;
        renderFrame();
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    // Smooth scroll scrubbing (scrub: 1.2)
    const frameAnim = gsap.to(stateRef.current, {
      targetFrame: TOTAL_FRAMES - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '#pinned-scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
        onUpdate: () => {
          renderFrame();
        },
      },
    });

    // Storytelling Scene Animations
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#pinned-scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
      },
    });

    tl.to('#scene-1', { opacity: 1, y: 0, duration: 1 })
      .to('#scene-1', { opacity: 0, y: -30, duration: 1 }, '+=1')
      
      .to('#scene-2', { opacity: 1, y: 0, duration: 1 })
      .to('#scene-2', { opacity: 0, y: -30, duration: 1 }, '+=1')
      
      .to('#scene-3', { opacity: 1, y: 0, duration: 1 })
      .to('#scene-3', { opacity: 0, y: -30, duration: 1 }, '+=1')
      
      .to('#scene-4', { opacity: 1, y: 0, duration: 1 })
      .to('#scene-4', { opacity: 0, y: -30, duration: 1 }, '+=1')
      
      .to('#scene-5', { opacity: 1, y: 0, duration: 1 })
      .to('#scene-5', { opacity: 0, y: -30, duration: 1 }, '+=1')
      
      .to('#scene-6', { opacity: 1, y: 0, duration: 1 })
      .to('#scene-6', { opacity: 0, y: -30, duration: 1 }, '+=1');

    // Mouse Listeners for ivress.co.jp hover effect
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
      renderFrame();
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      renderFrame();
    };

    const handleResize = () => {
      renderFrame();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      frameAnim.kill();
      tl.kill();
    };
  }, []);

  return (
    <canvas
      id="sequence-canvas"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full object-cover pointer-events-auto z-1"
    />
  );
}
