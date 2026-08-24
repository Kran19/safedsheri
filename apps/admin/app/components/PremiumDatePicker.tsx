'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface PremiumDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function PremiumDatePicker({ value, onChange, label = 'Date of Birth *', error = false }: PremiumDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse incoming value or default to 10 years ago
  const initialDate = value ? new Date(value) : new Date(new Date().setFullYear(new Date().getFullYear() - 10));
  
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [showYearSelector, setShowYearSelector] = useState(false);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowYearSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const handleDayClick = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    onChange(`${currentYear}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  const currentYearObj = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYearObj - i); // 0 to 15 years old max for kids pass

  const renderCalendar = () => {
    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
      <div className="animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            type="button"
            onClick={() => {
              if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
              else { setCurrentMonth(currentMonth - 1); }
            }}
            className="p-1.5 rounded-lg hover:bg-[#F2E8D5] text-[#8C6019] transition"
          >
            <ChevronLeft size={16} />
          </button>

          <button 
            type="button"
            onClick={() => setShowYearSelector(true)}
            className="flex items-center space-x-1.5 font-bold text-[#2D1F0E] hover:text-[#D99427] transition"
          >
            <span>{MONTHS[currentMonth]} {currentYear}</span>
            <ChevronDown size={14} />
          </button>

          <button 
            type="button"
            onClick={() => {
              if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
              else { setCurrentMonth(currentMonth + 1); }
            }}
            className="p-1.5 rounded-lg hover:bg-[#F2E8D5] text-[#8C6019] transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-[#8C6019] py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isSelected = value === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return (
              <button
                type="button"
                key={day}
                onClick={() => handleDayClick(day)}
                className={`h-8 w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all duration-200
                  ${isSelected 
                    ? 'bg-[#D99427] text-white shadow-md shadow-[#D99427]/30 scale-110 z-10' 
                    : 'text-[#2D1F0E] hover:bg-[#F2E8D5] hover:text-[#D99427]'}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearSelector = () => {
    return (
      <div className="animate-fade-in h-[220px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-3 gap-2">
          {years.map(y => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setCurrentYear(y);
                setShowYearSelector(false);
              }}
              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                y === currentYear 
                  ? 'bg-[#D99427] text-white shadow-md' 
                  : 'bg-[#F2E8D5] text-[#6E5336] hover:bg-[#EAD9B8] hover:text-[#2D1F0E]'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[11px] font-bold text-[#6E5336] mb-1">{label}</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-2xl bg-[#FAF6EE] border text-left flex items-center justify-between outline-none transition-all
          ${error && !value ? 'border-rose-400' : 'border-[#EAD9B8] focus:border-[#D99427] hover:border-[#D99427]/50'}
        `}
      >
        <span className={value ? 'text-[#2D1F0E] text-xs font-medium' : 'text-[#A89885] text-xs'}>
          {value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select Date'}
        </span>
        <Calendar size={16} className="text-[#D99427]" />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+0.5rem)] left-0 w-[280px] bg-white border border-[#EAD9B8] rounded-2xl shadow-xl shadow-[#D99427]/10 p-4 z-50">
          {showYearSelector ? renderYearSelector() : renderCalendar()}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #FAF6EE;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #EAD9B8;
          border-radius: 4px;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.2s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
