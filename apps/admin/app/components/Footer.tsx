'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LogoSlot from './LogoSlot';

export default function Footer() {
  return (
    <footer className="py-8 px-6 bg-[#FAF6EE] z-10 relative overflow-hidden text-[#4A3B2C]">
      <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none">
        <Image 
          src="/images/footer-optimized.webp" 
          alt="Footer Background" 
          fill 
          className="object-cover object-center opacity-60" 
          quality={75} 
          loading="lazy" 
        />
      </div>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-5 md:gap-8">
          <div className="flex items-center space-x-3">
            <Link href="/" className="cursor-pointer">
              <LogoSlot size="sm" showText={true} showDate={false} />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 text-sm md:text-base font-medium">
            <Link href="/#call" className="hover:text-[#D99427] transition">The Concept</Link>
            <span className="text-[#D99427] text-xs">✦</span>
            <Link href="/#colour" className="hover:text-[#D99427] transition">Dress Code</Link>
            <span className="text-[#D99427] text-xs">✦</span>
            <Link href="/#gallery" className="hover:text-[#D99427] transition">Gallery</Link>
            <span className="text-[#D99427] text-xs">✦</span>
            <Link href="/#gazebos" className="hover:text-[#D99427] transition">Gazebo Lounges</Link>
            <span className="text-[#D99427] text-xs">✦</span>
            <Link href="/#passes" className="hover:text-[#D99427] transition">Pass Privilege</Link>
          </div>
        </div>

        {/* Horizontal Divider 1 */}
        <div className="relative flex items-center justify-center w-full mt-2 mb-2">
          <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[#D99427]/40 to-transparent"></div>
          <div className="relative bg-[#FAF6EE] px-4 text-[#D99427]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
            </svg>
          </div>
        </div>

        {/* Middle Section - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-8 md:gap-0 md:divide-x md:divide-[#D99427]/30">

          {/* Column 1: Brand */}
          <div className="flex flex-col items-center px-4">
            <h4 className="font-serif font-bold text-[#1A1A1A] text-lg md:text-xl mb-1 tracking-wide">Safed Sheri 2026</h4>
            <div className="flex items-center justify-center w-full my-2">
              <div className="h-[1px] w-12 bg-[#D99427]/50"></div>
              <span className="text-[#D99427] text-[8px] mx-2">✦</span>
              <div className="h-[1px] w-12 bg-[#D99427]/50"></div>
            </div>
            <p className="max-w-[240px] text-[15px] leading-relaxed text-center font-medium">
              Rajkot's grandest Navratri celebration — tradition, culture & festivity.
            </p>
          </div>

          {/* Column 2: Contact Us */}
          <div className="flex flex-col items-center px-4">
            <h4 className="font-serif font-bold text-[#1A1A1A] text-lg md:text-xl mb-1 tracking-wide">Contact Us</h4>
            <div className="flex items-center justify-center w-full my-2">
              <div className="h-[1px] w-12 bg-[#D99427]/50"></div>
              <span className="text-[#D99427] text-[8px] mx-2">✦</span>
              <div className="h-[1px] w-12 bg-[#D99427]/50"></div>
            </div>
            <div className="flex flex-col gap-4 mt-2 w-[240px]">
              <a href="tel:+917016977518" className="flex items-center gap-4 hover:text-[#D99427] transition group">
                <div className="w-10 h-10 rounded-full border border-[#D99427]/60 group-hover:border-[#D99427] flex items-center justify-center text-[#D99427] bg-[#FAF6EE] shrink-0 shadow-[0_0_10px_rgba(217,148,39,0.1)]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium">+91 70169 77518</span>
              </a>
              <a href="mailto:safedsheri9@gmail.com" className="flex items-center gap-4 hover:text-[#D99427] transition group">
                <div className="w-10 h-10 rounded-full border border-[#D99427]/60 group-hover:border-[#D99427] flex items-center justify-center text-[#D99427] bg-[#FAF6EE] shrink-0 shadow-[0_0_10px_rgba(217,148,39,0.1)]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium">safedsheri9@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Column 3: Office */}
          <div className="flex flex-col items-center justify-center px-4 h-full">
            <div className="flex items-start gap-4 mt-2 md:mt-0 w-[240px]">
              <div className="w-10 h-10 rounded-full border border-[#D99427]/60 flex items-center justify-center text-[#D99427] bg-[#FAF6EE] shrink-0 shadow-[0_0_10px_rgba(217,148,39,0.1)]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <address className="not-italic text-[15px] font-medium leading-relaxed text-left">
                Regency Lagoon Resort,<br />
                Nyari Dam Rd, off Kalavad Road,<br />
                Rajkot, Vajdi,<br />
                Gujarat 360005
              </address>
            </div>
          </div>

        </div>

        {/* Horizontal Divider 2 */}
        <div className="relative flex items-center justify-center w-full mt-4 mb-2">
          <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[#D99427]/40 to-transparent"></div>
          <div className="relative bg-[#FAF6EE] px-4 text-[#D99427]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
            </svg>
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-center flex flex-col items-center">
          <div className="text-[14px] md:text-[15px] font-medium">© 2026 Safed Sheri all right reserved</div>
          <div className="mt-2 text-xs flex items-center justify-center space-x-3 text-[#D99427] font-medium">
            <Link href="/terms-and-conditions" className="hover:underline transition cursor-pointer z-20 relative">Terms & Conditions</Link>
            <span>|</span>
            <Link href="/privacy-policy" className="hover:underline transition cursor-pointer z-20 relative">Privacy Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
