'use client';

import React, { useState } from 'react';
import { 
  Users, Crown, Shield, ArrowRight, CheckCircle2, Phone, AlertCircle, 
  X, Upload, Sparkles, Clock, Check, Heart, Baby 
} from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface AttendeeForm {
  fullName: string;
  phone: string;
  email: string;
  gender: 'MALE' | 'FEMALE';
  aadhaarNumber: string;
  frontUploaded: boolean;
  backUploaded: boolean;
  frontStorageKey?: string;
  backStorageKey?: string;
  frontUploading?: boolean;
  backUploading?: boolean;
  kidsAgeGroup?: string;
  dob?: string;
}

export default function FamilyAndFriendsPage() {
  const [passType, setPassType] = useState<'SINGLE' | 'COUPLE' | 'KIDS'>('COUPLE');
  const [hostNotes, setHostNotes] = useState('');
  
  const [attendees, setAttendees] = useState<AttendeeForm[]>([
    {
      fullName: '',
      phone: '',
      email: '',
      gender: 'MALE',
      aadhaarNumber: '',
      frontUploaded: false,
      backUploaded: false,
    },
    {
      fullName: '',
      phone: '',
      email: '',
      gender: 'FEMALE',
      aadhaarNumber: '',
      frontUploaded: false,
      backUploaded: false,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);

  // Sync attendees length based on passType
  const handlePassTypeChange = (type: 'SINGLE' | 'COUPLE' | 'KIDS') => {
    setPassType(type);
    setError(null);
    if (type === 'SINGLE') {
      setAttendees([
        {
          fullName: attendees[0]?.fullName || '',
          phone: attendees[0]?.phone || '',
          email: attendees[0]?.email || '',
          gender: 'FEMALE',
          aadhaarNumber: attendees[0]?.aadhaarNumber || '',
          frontUploaded: attendees[0]?.frontUploaded || false,
          backUploaded: attendees[0]?.backUploaded || false,
          frontStorageKey: attendees[0]?.frontStorageKey,
          backStorageKey: attendees[0]?.backStorageKey,
        },
      ]);
    } else if (type === 'COUPLE') {
      setAttendees([
        {
          fullName: attendees[0]?.fullName || '',
          phone: attendees[0]?.phone || '',
          email: attendees[0]?.email || '',
          gender: 'MALE',
          aadhaarNumber: attendees[0]?.aadhaarNumber || '',
          frontUploaded: attendees[0]?.frontUploaded || false,
          backUploaded: attendees[0]?.backUploaded || false,
          frontStorageKey: attendees[0]?.frontStorageKey,
          backStorageKey: attendees[0]?.backStorageKey,
        },
        attendees[1] || {
          fullName: '',
          phone: '',
          email: '',
          gender: 'FEMALE',
          aadhaarNumber: '',
          frontUploaded: false,
          backUploaded: false,
        },
      ]);
    } else if (type === 'KIDS') {
      setAttendees([
        {
          fullName: attendees[0]?.fullName || '',
          phone: attendees[0]?.phone || '',
          email: attendees[0]?.email || '',
          gender: 'MALE',
          aadhaarNumber: attendees[0]?.aadhaarNumber || '',
          frontUploaded: attendees[0]?.frontUploaded || false,
          backUploaded: attendees[0]?.backUploaded || false,
          frontStorageKey: attendees[0]?.frontStorageKey,
          backStorageKey: attendees[0]?.backStorageKey,
          dob: '',
          kidsAgeGroup: '10-15',
        },
      ]);
    }
  };

  const updateAttendee = (index: number, field: keyof AttendeeForm, value: any) => {
    setAttendees((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Upload Aadhaar Front or Back
  const handleAadhaarUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number, side: 'FRONT' | 'BACK') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(`Aadhaar ${side} file for Guest ${index + 1} exceeds 5MB limit.`);
      return;
    }

    if (side === 'FRONT') updateAttendee(index, 'frontUploading', true);
    else updateAttendee(index, 'backUploading', true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('side', side.toLowerCase());

      const resRaw = await fetch(`${API_BASE}/uploads/aadhaar/extract`, {
        method: 'POST',
        body: formData,
      });

      const res = await resRaw.json();
      if (!resRaw.ok || res.success === false) {
        throw new Error(res.message || res.error || `Failed to process ${side} document.`);
      }

      if (side === 'FRONT') {
        setAttendees((prev) => {
          const copy = [...prev];
          copy[index] = { ...copy[index], frontUploaded: true };
          if (res.data?.storageKey) copy[index].frontStorageKey = res.data.storageKey;
          if (res.extractedData) {
            if (res.extractedData.name && !copy[index].fullName) {
              copy[index].fullName = res.extractedData.name;
            }
            if (res.extractedData.aadhaarNumber && !copy[index].aadhaarNumber) {
              copy[index].aadhaarNumber = res.extractedData.aadhaarNumber;
            }
          }
          return copy;
        });
      } else {
        setAttendees((prev) => {
          const copy = [...prev];
          copy[index] = { ...copy[index], backUploaded: true };
          if (res.data?.storageKey) copy[index].backStorageKey = res.data.storageKey;
          return copy;
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error processing Aadhaar document.');
    } finally {
      if (side === 'FRONT') updateAttendee(index, 'frontUploading', false);
      else updateAttendee(index, 'backUploading', false);
    }
  };

  // Submit Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];
      if (!att.fullName.trim()) {
        setError(`Please enter the full name for Guest ${i + 1}.`);
        return;
      }
      const cleanPhone = att.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setError(`Please enter a valid 10-digit WhatsApp phone number for Guest ${i + 1}.`);
        return;
      }
      if (passType === 'SINGLE' && att.gender !== 'FEMALE') {
        setError('Single pass tier is strictly reserved for female attendees.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        passType,
        notes: hostNotes.trim(),
        attendees: attendees.map((att) => ({
          fullName: att.fullName.trim(),
          phone: att.phone.replace(/\D/g, ''),
          email: att.email.trim() || undefined,
          gender: att.gender,
          aadhaarNumber: att.aadhaarNumber.replace(/\D/g, '') || '000000000000',
          documentKey: att.frontStorageKey,
          documentBackKey: att.backStorageKey,
          kidsAgeGroup: att.kidsAgeGroup,
          dob: att.dob,
        })),
      };

      const resRaw = await fetch(`${API_BASE}/registrations/family-friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await resRaw.json();

      if (!resRaw.ok || res.success === false) {
        throw new Error(res.message || res.error?.message || 'Failed to submit request.');
      }

      setSubmissionSuccess(res.data);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // SUCCESS / AWAITING APPROVAL SCREEN
  // =========================================================================
  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 flex items-center justify-center text-[#2D1F0E]">
        <div className="max-w-xl w-full bg-white border-2 border-[#EAD9B8] rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-6 animate-fade-in relative overflow-hidden">
          {/* Top Gold Gradient Stripe */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427]" />

          <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-amber-600 mx-auto shadow-inner">
            <Clock className="w-10 h-10 animate-pulse text-[#D99427]" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#FFF5DC] text-[#8C6019] border border-[#E5A93C]">
              ⏳ Request Under Review
            </span>
            <h1 className="text-3xl font-serif font-bold text-[#2D1F0E] mt-3">
              Request Submitted Successfully!
            </h1>
            <p className="text-xs text-[#6E5336] mt-2 max-w-md mx-auto leading-relaxed">
              Your complimentary <strong>Family &amp; Friends</strong> pass request has been safely received by the event organizers.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#EAD9B8] text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#EAD9B8]">
              <span className="text-[#6E5336]">Application Number:</span>
              <strong className="text-base text-[#2D1F0E] font-bold">{submissionSuccess.registrationNumber}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6E5336]">Pass Category:</span>
              <strong className="text-[#8C6019] font-bold">{submissionSuccess.passType} PASS</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6E5336]">Pass Amount:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                ₹0 (Complimentary)
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#EAD9B8]">
              <span className="text-[#6E5336]">Current Status:</span>
              <span className="text-amber-800 font-bold">Awaiting Admin Approval</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <span>⚠️</span>
              <span>Important Note on QR Code Issuance:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              No QR entry code has been generated yet. As per event policy, digital passes and scannable QR credentials will be minted automatically once your application is reviewed and approved by event administration.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmissionSuccess(null);
                setAttendees([
                  { fullName: '', phone: '', email: '', gender: 'MALE', aadhaarNumber: '', frontUploaded: false, backUploaded: false },
                  { fullName: '', phone: '', email: '', gender: 'FEMALE', aadhaarNumber: '', frontUploaded: false, backUploaded: false },
                ]);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#EAD9B8] text-[#6E5336] hover:bg-[#FAF6EE] text-xs font-bold uppercase tracking-wider transition"
            >
              Submit Another Request
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#2D1F0E] text-white hover:bg-[#3D2C15] text-xs font-bold uppercase tracking-wider transition shadow-md"
            >
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // REQUEST FORM SCREEN
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 text-[#2D1F0E]">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        
        {/* HEADER */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#FFF5DC] border border-[#E5A93C] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D99427]" />
            <span className="text-[10px] font-mono font-bold text-[#8C6019] uppercase tracking-wider">
              EXCLUSIVE INVITATION • VIP GUEST DESK
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#2D1F0E] tracking-tight">
            Family &amp; Friends Pass Request
          </h1>
          <p className="text-xs sm:text-sm text-[#6E5336] max-w-xl mx-auto leading-relaxed">
            Please register your details below to request your complimentary passes for Safed Sheri 2026. All entries will be verified and approved by the event organizers before QR passes are issued.
          </p>
        </div>

        {/* ERROR NOTICE */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs flex items-center justify-between shadow-sm animate-shake">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button onClick={() => setError(null)}><X className="w-4 h-4 text-rose-700" /></button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* STEP 1: CATEGORY SELECTOR */}
          <div className="p-6 md:p-8 bg-white border border-[#EAD9B8] rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#8C6019] flex items-center space-x-2 font-mono">
                <span>1. Select Pass Category</span>
              </h2>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                ₹0 Complimentary Pass
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Couple */}
              <div
                onClick={() => handlePassTypeChange('COUPLE')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  passType === 'COUPLE'
                    ? 'bg-gradient-to-br from-[#FFF5DC] to-[#FAF6EE] border-[#D99427] shadow-md ring-2 ring-[#D99427]/40'
                    : 'bg-white border-[#EAD9B8] hover:border-[#D99427]/60'
                }`}
              >
                <div>
                  <div className="text-lg">💑</div>
                  <div className="font-serif font-bold text-sm text-[#2D1F0E] mt-1">Couple Pass</div>
                  <div className="text-[11px] text-[#6E5336] mt-0.5">2 Guests (Female + Male)</div>
                </div>
                <div className="mt-3 text-[10px] font-mono font-bold text-[#8C6019]">
                  {passType === 'COUPLE' ? '✓ Selected' : 'Select'}
                </div>
              </div>

              {/* Single Female */}
              <div
                onClick={() => handlePassTypeChange('SINGLE')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  passType === 'SINGLE'
                    ? 'bg-gradient-to-br from-purple-50 to-[#FAF6EE] border-purple-400 shadow-md ring-2 ring-purple-400/40'
                    : 'bg-white border-[#EAD9B8] hover:border-purple-300'
                }`}
              >
                <div>
                  <div className="text-lg">🌸</div>
                  <div className="font-serif font-bold text-sm text-purple-950 mt-1">Single Female</div>
                  <div className="text-[11px] text-purple-800 mt-0.5">1 Female Attendee</div>
                </div>
                <div className="mt-3 text-[10px] font-mono font-bold text-purple-700">
                  {passType === 'SINGLE' ? '✓ Selected' : 'Select'}
                </div>
              </div>

              {/* Kids */}
              <div
                onClick={() => handlePassTypeChange('KIDS')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  passType === 'KIDS'
                    ? 'bg-gradient-to-br from-emerald-50 to-[#FAF6EE] border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                    : 'bg-white border-[#EAD9B8] hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="text-lg">🧒</div>
                  <div className="font-serif font-bold text-sm text-emerald-950 mt-1">Kids Pass</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">Child aged 10-15</div>
                </div>
                <div className="mt-3 text-[10px] font-mono font-bold text-emerald-700">
                  {passType === 'KIDS' ? '✓ Selected' : 'Select'}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: GUEST DETAILS & AADHAAR */}
          <div className="space-y-6">
            {attendees.map((att, idx) => (
              <div 
                key={idx} 
                className="p-6 md:p-8 bg-white border border-[#EAD9B8] rounded-3xl shadow-sm space-y-5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#EAD9B8]">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D1F0E] flex items-center space-x-2 font-mono">
                    <span className="w-6 h-6 rounded-full bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-bold text-[#8C6019] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>
                      {passType === 'COUPLE' 
                        ? (idx === 0 ? 'Primary Guest (Male / Female)' : 'Partner Guest') 
                        : 'Guest Attendee Details'}
                    </span>
                  </h3>
                  <span className="text-[10px] font-mono uppercase text-[#6E5336]">
                    Mandatory ID Check
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6E5336] mb-1 tracking-wider">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={att.fullName}
                      onChange={(e) => updateAttendee(idx, 'fullName', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none"
                    />
                  </div>

                  {/* WhatsApp Phone */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6E5336] mb-1 tracking-wider">
                      WhatsApp Mobile Number *
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 rounded-l-xl bg-[#EAD9B8]/40 border border-r-0 border-[#EAD9B8] text-xs font-bold text-[#6E5336]">
                        +91
                      </span>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        placeholder="10-digit number"
                        value={att.phone}
                        onChange={(e) => updateAttendee(idx, 'phone', e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-2.5 rounded-r-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6E5336] mb-1 tracking-wider">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={att.email}
                      onChange={(e) => updateAttendee(idx, 'email', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6E5336] mb-1 tracking-wider">
                      Gender *
                    </label>
                    <select
                      value={att.gender}
                      disabled={passType === 'SINGLE'}
                      onChange={(e) => updateAttendee(idx, 'gender', e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-bold text-[#2D1F0E] focus:border-[#D99427] outline-none cursor-pointer"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  {/* Aadhaar Number */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-[#6E5336] mb-1 tracking-wider">
                      12-Digit Aadhaar Card Number *
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      placeholder="XXXX XXXX XXXX"
                      value={att.aadhaarNumber}
                      onChange={(e) => updateAttendee(idx, 'aadhaarNumber', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none font-mono tracking-wider"
                    />
                  </div>
                </div>

                {/* Aadhaar Card Photos Upload */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold uppercase text-[#6E5336] mb-2 tracking-wider">
                    Upload Aadhaar Card Photo (Front &amp; Back)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Front Upload */}
                    <label className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition text-center ${
                      att.frontUploaded 
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900' 
                        : 'bg-[#FAF6EE] border-[#EAD9B8] hover:border-[#D99427] text-[#6E5336]'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAadhaarUpload(e, idx, 'FRONT')}
                      />
                      {att.frontUploading ? (
                        <div className="text-xs font-bold text-[#D99427] animate-pulse">Uploading Front...</div>
                      ) : att.frontUploaded ? (
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Front Side Uploaded</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-5 h-5 mx-auto text-[#8C6019]" />
                          <div className="text-xs font-bold text-[#2D1F0E]">Upload Aadhaar Front</div>
                          <div className="text-[10px] text-gray-500">JPG, PNG (Max 5MB)</div>
                        </div>
                      )}
                    </label>

                    {/* Back Upload */}
                    <label className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition text-center ${
                      att.backUploaded 
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900' 
                        : 'bg-[#FAF6EE] border-[#EAD9B8] hover:border-[#D99427] text-[#6E5336]'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAadhaarUpload(e, idx, 'BACK')}
                      />
                      {att.backUploading ? (
                        <div className="text-xs font-bold text-[#D99427] animate-pulse">Uploading Back...</div>
                      ) : att.backUploaded ? (
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Back Side Uploaded</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-5 h-5 mx-auto text-[#8C6019]" />
                          <div className="text-xs font-bold text-[#2D1F0E]">Upload Aadhaar Back</div>
                          <div className="text-[10px] text-gray-500">JPG, PNG (Max 5MB)</div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* STEP 3: HOST / RELATIONSHIP NOTE */}
          <div className="p-6 md:p-8 bg-white border border-[#EAD9B8] rounded-3xl shadow-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#8C6019] font-mono">
              2. Host or Reference Note (Optional)
            </h2>
            <p className="text-xs text-[#6E5336]">
              Mention who invited you or your relationship with the organizer for faster verification:
            </p>
            <input
              type="text"
              placeholder="e.g. Friend of Organizer, VIP Family Member"
              value={hostNotes}
              onChange={(e) => setHostNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs text-[#2D1F0E] focus:border-[#D99427] outline-none"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition disabled:opacity-50 flex items-center justify-center space-x-2 mx-auto"
            >
              {loading ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Family &amp; Friends Request</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-[#8C6019] mt-3">
              🔒 No payment required. Passes will be reviewed and activated by event administration.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
