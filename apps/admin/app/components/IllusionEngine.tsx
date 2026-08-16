'use client';

import React, { useEffect, useRef, useState } from 'react';

interface IllusionEngineProps {
  className?: string;
}

export const IllusionEngine: React.FC<IllusionEngineProps> = ({
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Warm Sunburst Golden Embers & Ivory Shimmer Particles
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1,
      baseAlpha: Math.random() * 0.35 + 0.15,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -Math.random() * 0.4 - 0.1,
      color: Math.random() > 0.3 ? '217, 148, 39' : '246, 200, 95', // Golden Sunburst
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulse: Math.random() * Math.PI,
    }));

    let rotationAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Soft sunlit warm ivory radial glow following pointer
      const targetX = width * mousePos.x;
      const targetY = height * mousePos.y;
      const gradient = ctx.createRadialGradient(
        targetX,
        targetY,
        40,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      gradient.addColorStop(0, 'rgba(251, 244, 228, 0.6)');
      gradient.addColorStop(0.4, 'rgba(248, 245, 238, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Sacred Navratri Circular Geometry in Radiant Gold
      rotationAngle += 0.001;
      const centerX = width / 2;
      const centerY = height * 0.45;
      const radiusBase = Math.min(width, height) * 0.38;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationAngle);

      // Outer Sun Ring
      ctx.strokeStyle = 'rgba(217, 148, 39, 0.12)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, radiusBase, 0, Math.PI * 2);
      ctx.stroke();

      // Inner 12-point Garba Star
      const points = 12;
      ctx.strokeStyle = 'rgba(229, 169, 60, 0.08)';
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const angle = (i * Math.PI * 2) / points;
        const x1 = Math.cos(angle) * (radiusBase * 0.85);
        const y1 = Math.sin(angle) * (radiusBase * 0.85);
        const x2 = Math.cos(angle + Math.PI / points) * (radiusBase * 0.45);
        const y2 = Math.sin(angle + Math.PI / points) * (radiusBase * 0.45);
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.restore();

      // Floating Sunlit Golden Sparkles
      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += p.pulseSpeed;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = p.baseAlpha + Math.sin(p.pulse) * 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${Math.max(0, currentAlpha)})`;
        ctx.shadowColor = `rgba(${p.color}, 0.4)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
