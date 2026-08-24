'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { garbaAudio } from './GarbaAudioEngine';

const VIBE_IMAGES = [
  "/images/galleryimg/DSC01645.JPG.jpeg",
  "/images/galleryimg/DSC01653.JPG.jpeg",
  "/images/galleryimg/DSC01674.JPG.jpeg",
  "/images/galleryimg/DSC02121.JPG.jpeg",
  "/images/galleryimg/DSC02129.JPG.jpeg",
];

export function Vibe3DOrbit() {
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  
  // Responsive sizing
  const [radius, setRadius] = useState(380);
  const [cardWidth, setCardWidth] = useState(480);
  const [cardHeight, setCardHeight] = useState(280);

  const numImages = VIBE_IMAGES.length;
  const angleStep = 360 / numImages;

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 768) {
        setRadius(240);
        setCardWidth(280);
        setCardHeight(180);
      } else {
        setRadius(380);
        setCardWidth(480);
        setCardHeight(280);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || isHovered || isDragging) return;
    const timer = setInterval(() => {
      setRotation((prev) => prev - 0.5);
    }, 30);
    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, isDragging]);

  useEffect(() => {
    const normalized = ((-rotation % 360) + 360) % 360;
    const closestIdx = Math.round(normalized / angleStep) % numImages;
    setActiveIndex(closestIdx);
  }, [rotation, angleStep, numImages]);

  const rotateTo = (index: number) => {
    garbaAudio.playDandiya();
    const targetAngle = -index * angleStep;
    setRotation(targetAngle);
  };

  const handleNext = () => {
    garbaAudio.playDandiya();
    setRotation((prev) => prev - angleStep);
  };

  const handlePrev = () => {
    garbaAudio.playDandiya();
    setRotation((prev) => prev + angleStep);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setRotation((prev) => prev + deltaX * 0.4);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full py-2 flex flex-col items-center">
      {/* 3D CAROUSEL CONTAINER */}
      <div
        className="relative h-[350px] md:h-[450px] w-full flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
        style={{ perspective: '1500px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsHovered(false); setIsDragging(false); }}
        onMouseEnter={() => setIsHovered(true)}
      >
        <div
          className="relative transition-transform duration-75"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotation}deg)`,
          }}
        >
          {VIBE_IMAGES.map((src, idx) => {
            const cardAngle = idx * angleStep;
            const isCurrent = activeIndex === idx;

            // Calculate the absolute angle of this card in 3D space
            // Using Math.cos gives us the Z-depth (-1 for back, 1 for front)
            const currentAngle = (cardAngle + rotation) % 360;
            const zIndex = Math.round(Math.cos(currentAngle * (Math.PI / 180)) * 100) + 100;

            return (
              <div
                key={idx}
                onClick={() => { rotateTo(idx); }}
                className={`absolute inset-0 rounded-2xl overflow-hidden border-[4px] transition-all duration-300 shadow-2xl bg-white`}
                style={{
                  transform: `rotateY(${cardAngle}deg) translateZ(${radius}px)`,
                  borderColor: isCurrent ? '#D99427' : '#EAD9B8',
                  boxShadow: isCurrent
                    ? '0 25px 50px -12px rgba(217, 148, 39, 0.4)'
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  opacity: isCurrent ? 1 : 0.4,
                  filter: isCurrent ? 'grayscale(0%)' : 'grayscale(30%)',
                  zIndex: zIndex,
                }}
              >
                <img src={src} alt={`Safed Sheri Vibe ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center space-x-4 mt-8 md:mt-12 z-20 relative">
        <button
          onClick={handlePrev}
          className="p-3 rounded-full bg-white border border-[#EAD9B8] text-[#2D1F0E] hover:border-[#D99427] transition shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => { garbaAudio.playDandiya(); setIsAutoPlaying(!isAutoPlaying); }}
          className="px-5 py-2.5 rounded-full bg-white border border-[#EAD9B8] text-[#2D1F0E] hover:border-[#D99427] font-bold text-sm flex items-center space-x-2 transition shadow-sm"
        >
          {isAutoPlaying ? (
            <>
              <Pause className="w-4 h-4 text-[#D99427]" />
              <span>Pause Orbit</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-600" />
              <span>Resume Orbit</span>
            </>
          )}
        </button>

        <button
          onClick={handleNext}
          className="p-3 rounded-full bg-white border border-[#EAD9B8] text-[#2D1F0E] hover:border-[#D99427] transition shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
