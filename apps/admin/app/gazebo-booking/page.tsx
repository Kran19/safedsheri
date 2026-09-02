'use client';

import React, { useState } from 'react';
import { Upload, Crown, Shield, ArrowRight, CheckCircle2, Phone, AlertCircle, X, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function formatAadhaarNumber(val: string): string {
  const digits = (val || '').replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

function formatPhoneNumber(val: string): string {
  const digits = (val || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return digits;
}

const TermsAndConditionsContent = () => (
  <div className="mt-3 opacity-90 leading-relaxed animate-fade-in text-xs max-h-48 overflow-y-auto pr-2 custom-scrollbar text-left text-[#6E5336]">
    <div className="space-y-4">
      <div>
        <h5 className="font-bold text-[#2D1F0E]">1. Pass Booking Rules</h5>
        <ul className="list-disc pl-4 space-y-1">
          <li>All Safed Sheri passes are subject to availability.</li>
          <li>Booking is confirmed only after successful payment and receipt of an official confirmation.</li>
          <li>Each attendee must provide their own valid Aadhaar card details for booking verification.</li>
          <li>Passes are valid only for the category selected at the time of booking.</li>
          <li>Incorrect, incomplete, duplicate, or unverifiable booking details may result in cancellation or denial of entry.</li>
          <li>Passes may not be duplicated, altered, resold, or used fraudulently.</li>
          <li>No group booking discounts are applicable. Every attendee is valued individually.</li>
          <li>Early Bird Passes are limited and may sell out without prior notice.</li>
        </ul>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">2. Gazebo Booking Rules</h5>
        <ul className="list-disc pl-4 space-y-1">
          <li>Gazebos are limited and offered strictly subject to availability.</li>
          <li>A gazebo booking is considered confirmed only after full payment and official confirmation from Safed Sheri.</li>
          <li>The permitted guest capacity of the selected gazebo must be followed.</li>
          <li>Guests exceeding the approved gazebo capacity may require additional valid passes.</li>
          <li>Gazebo allocation, positioning, layout, or access may be managed by the event organizers according to operational requirements.</li>
          <li>Gazebo bookings may not be resold or transferred without prior approval from Safed Sheri.</li>
          <li>Any damage caused to the gazebo, furniture, décor, or venue property by guests may be chargeable to the booking holder.</li>
        </ul>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">3. Gazebo Occupancy</h5>
        <p className="mt-1">
          If a child is below 10 years of age, they will not be counted in the 14-member capacity. Children 10 years and above will be counted as part of the 14 members. Please book accordingly.
        </p>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">4. Terms &amp; Conditions</h5>
        <p className="mt-1">
          There will be no modifications to the terms and conditions. No two different terms and conditions can be mixed or matched.
        </p>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">5. Gazebo Layout &amp; Position</h5>
        <p className="mt-1">
          Changes to the layout and positions are subject to practicality. However, rest assured, your gazebo position will remain intact.
        </p>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">6. Gazebo Facilities &amp; Benefits</h5>
        <p className="mt-1">
          The facilities and benefits of the gazebos will be sent personally. The organizers reserve the right to make modifications considering the practicality of the situation at any given point in time. Everything will be pre-informed and clearly defined.
        </p>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">7. Entry &amp; Verification Rules</h5>
        <ul className="list-disc pl-4 space-y-1">
          <li>Every attendee may be required to present their booking confirmation along with a valid government-issued photo ID at the venue.</li>
          <li>The attendee's booking information should match the submitted identification details.</li>
          <li>Entry may be denied if a pass cannot be verified or appears duplicated, modified, transferred, or fraudulent.</li>
          <li>Security screening may be conducted at the entrance for the safety of all attendees.</li>
          <li>Guests must cooperate with security personnel and event management.</li>
          <li>Re-entry, if permitted, will be subject to the entry policy followed on the event day.</li>
        </ul>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">8. Offline &amp; Online Booking</h5>
        <ul className="list-disc pl-4 space-y-1">
          <li>Online bookings should be completed only through the official Safed Sheri booking platform.</li>
          <li>Offline sales will be available exclusively at Ekasha on 26th August 2026.</li>
          <li>Availability shown during booking is subject to change until payment is successfully completed.</li>
          <li>Safed Sheri will not be responsible for payments made through unauthorized sellers, third parties, or unofficial booking links.</li>
        </ul>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">9. Cancellation, Refund &amp; Transfer Policy</h5>
        <ul className="list-disc pl-4 space-y-1">
          <li>All confirmed Pass and Gazebo bookings are non-refundable and non-transferable.</li>
          <li>No refunds will be provided for a change of mind, personal scheduling conflict, late arrival, or failure to attend.</li>
          <li>Booking charges, transaction charges, or convenience fees, if applicable, are non-refundable.</li>
          <li>Any refund or adjustment arising from an event cancellation or postponement will be handled according to the official policy announced by Safed Sheri.</li>
          <li>Any event postponement or cancellation due to natural rains or weather conditions on the day of the event is not subject to refunds.</li>
        </ul>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">10. Event Changes &amp; Force Majeure</h5>
        <ul className="list-disc pl-4 space-y-1">
          <li>Safed Sheri reserves the right to modify the event schedule, timings, entry procedures, layout, performers, activities, or operational arrangements when reasonably required.</li>
          <li>Changes may occur due to weather, safety concerns, government regulations, venue requirements, technical issues, or circumstances beyond the organizer's control.</li>
          <li>Such operational changes will not automatically qualify a booking for a refund unless officially announced otherwise by Safed Sheri.</li>
        </ul>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">11. Venue &amp; Behaviour Guidelines</h5>
        <ul className="list-disc pl-4 space-y-1">
          <li>Guests must follow all venue rules and instructions issued by event management and security personnel.</li>
          <li>Safed Sheri reserves the right to refuse entry or remove any attendee involved in abusive, disruptive, dangerous, illegal, or inappropriate behaviour.</li>
          <li>Prohibited or restricted items may not be carried inside the venue.</li>
          <li>Outside food, beverages, alcohol, tobacco products, weapons, illegal substances, or other restricted items may be prohibited depending on venue policy.</li>
          <li>Guests are responsible for their own personal belongings.</li>
        </ul>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">12. Children &amp; Family Attendance</h5>
        <ul className="list-disc pl-4 space-y-1">
          <li>Children must remain under the supervision of their parent or legal guardian.</li>
          <li>Parents or guardians are responsible for the safety and conduct of children attending with them.</li>
          <li>Age-specific passes or identification requirements, if applicable, must be followed at the time of booking and entry.</li>
        </ul>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">13. Photography &amp; Media</h5>
        <ul className="list-disc pl-4 space-y-1">
          <li>Photography, videography, and event documentation may take place during Safed Sheri.</li>
          <li>Attendees may appear incidentally in photographs, videos, reels, or other event-related content.</li>
          <li>Such content may be used for event documentation, social media, publicity, and promotional purposes, subject to applicable law.</li>
        </ul>
      </div>
      <div>
        <h5 className="font-bold text-[#2D1F0E]">14. Final Acceptance</h5>
        <p className="mt-1">
          By purchasing or using a Safed Sheri Pass or Gazebo booking, the attendee confirms that they have read, understood, and agreed to the applicable booking, entry, event, and venue Terms &amp; Conditions.
        </p>
      </div>
    </div>
  </div>
);

export default function GazeboBookingPage() {
  const [gazeboNumber, setGazeboNumber] = useState<number | null>(null);
  
  const [attendees, setAttendees] = useState([{
    fullName: '',
    phone: '',
    email: '',
    aadhaarNumber: '',
    frontUploaded: false,
    backUploaded: false,
    frontUploading: false,
    backUploading: false,
    frontStorageKey: '',
    backStorageKey: '',
  }]);
  const [notes, setNotes] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // OTP Verification States
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const updateAttendee = (index: number, field: string, value: any) => {
    setAttendees((prev) => {
      const newAttendees = [...prev];
      newAttendees[index] = { ...newAttendees[index], [field]: value };
      return newAttendees;
    });
  };

  const handleAadhaarUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number, side: 'FRONT' | 'BACK') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(`Aadhaar ${side} document for Guest ${index + 1} exceeds 5MB limit.`);
      return;
    }

    if (side === 'FRONT') updateAttendee(index, 'frontUploading', true);
    else updateAttendee(index, 'backUploading', true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('side', side.toLowerCase());

      const endpoint = '/uploads/aadhaar/extract';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const res = await response.json();
      if (!response.ok || res.success === false) {
        const errorMsg = res.message || res.error?.message || res.error || `Failed to process ${side} document.`;
        throw new Error(typeof errorMsg === 'string' ? errorMsg : errorMsg[0]);
      }

      if (side === 'FRONT') {
        setAttendees((prev) => {
          const newAttendees = [...prev];
          newAttendees[index] = { ...newAttendees[index], frontUploaded: true };
          if (res.data?.storageKey) {
            newAttendees[index].frontStorageKey = res.data.storageKey;
          }
          if (res.extractedData) {
            const ex = res.extractedData;
            if (ex.name) newAttendees[index].fullName = ex.name;
            if (ex.aadhaarNumber) newAttendees[index].aadhaarNumber = ex.aadhaarNumber;
          }
          return newAttendees;
        });
      } else {
        setAttendees((prev) => {
          const newAttendees = [...prev];
          newAttendees[index] = { ...newAttendees[index], backUploaded: true };
          if (res.data?.storageKey) {
            newAttendees[index].backStorageKey = res.data.storageKey;
          }
          return newAttendees;
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error processing Aadhaar document.');
    } finally {
      if (side === 'FRONT') updateAttendee(index, 'frontUploading', false);
      else updateAttendee(index, 'backUploading', false);
    }
  };

  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!gazeboNumber) return setError('Please select a specific Gazebo (1-14).');
    
    const phones = new Set();
    const aadhaars = new Set();

    // Validate all attendees
    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];
      if (!att.frontUploaded || !att.backUploaded) return setError(`Please upload both sides of the Aadhaar card for Guest ${i + 1}.`);
      if (!att.fullName.trim()) return setError(`Please enter the full name for Guest ${i + 1}.`);
      
      const cleanPhone = att.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) return setError(`Please enter a valid 10-digit WhatsApp phone number for Guest ${i + 1}.`);
      if (phones.has(cleanPhone)) return setError(`Phone number ${cleanPhone} is used multiple times. Each guest must have a unique phone number.`);
      phones.add(cleanPhone);
      
      const cleanAadhaar = att.aadhaarNumber.replace(/\D/g, '');
      if (cleanAadhaar.length !== 12) return setError(`Please enter a valid 12-digit Aadhaar number for Guest ${i + 1}.`);
      if (aadhaars.has(cleanAadhaar)) return setError(`Aadhaar number ${cleanAadhaar} is used multiple times. Each guest must have a unique Aadhaar number.`);
      aadhaars.add(cleanAadhaar);

      if (i === 0 && !att.email.trim()) return setError('Please enter the email address for Guest 1.');
    }

    if (!termsAccepted) return setError('You must accept the Terms & Conditions.');

    // Initiate OTP to primary phone
    setOtpModalOpen(true);
    setOtpLoading(true);
    setOtpError(null);
    setOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpCode('');

    try {
      const primaryPhone = attendees[0].phone.replace(/\D/g, '');
      const res = await fetch(`${API_BASE}/auth/whatsapp-otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: primaryPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
      } else {
        setOtpError(data.message || 'Failed to send WhatsApp OTP.');
      }
    } catch (err: any) {
      console.error(err);
      setOtpError('Failed to communicate with server.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpInput = (val: string, index: number) => {
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);
    setOtpCode(newDigits.join(''));

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newDigits = [...otpDigits];
      if (!otpDigits[index] && index > 0) {
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        setOtpCode(newDigits.join(''));
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        newDigits[index] = '';
        setOtpDigits(newDigits);
        setOtpCode(newDigits.join(''));
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setOtpLoading(true);
    setOtpError(null);

    const primaryPhone = attendees[0].phone.replace(/\D/g, '');

    try {
      const res = await fetch(`${API_BASE}/auth/whatsapp-otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: primaryPhone, code: otpCode }),
      });
      const data = await res.json();

      if (data.success && data.data?.otpToken) {
        await handleFinalSubmission(data.data.otpToken);
      } else {
        setOtpError(data.message || 'Invalid or expired OTP code.');
        setOtpLoading(false);
      }
    } catch (err) {
      setOtpError('Failed to verify OTP. Please try again.');
      setOtpLoading(false);
    }
  };

  const handleFinalSubmission = async (otpToken: string) => {
    try {
      const validAttendees = attendees.filter(a => a.fullName.trim() !== '');
      const primary = validAttendees[0];

      const membersNotes = validAttendees.map((a, i) => {
        let note = `Guest ${i+1}: ${a.fullName} | Ph: ${a.phone} | Email: ${a.email} | Aadh: ${a.aadhaarNumber.replace(/\D/g, '')}`;
        if (a.frontStorageKey) note += ` | [Aadhaar Front Side](/api/v1/uploads/direct/${a.frontStorageKey})`;
        if (a.backStorageKey) note += ` | [Aadhaar Back Side](/api/v1/uploads/direct/${a.backStorageKey})`;
        return note;
      }).join('\n');

      // Determine level based on gazeboNumber (1-4 is level 1, 5-8 is level 2, 9-14 is level 3)
      let gazeboLevel = 1;
      if (gazeboNumber !== null && gazeboNumber > 4 && gazeboNumber <= 8) gazeboLevel = 2;
      else if (gazeboNumber !== null && gazeboNumber > 8) gazeboLevel = 3;

      const payload = {
        level: gazeboLevel,
        gazeboNumber: gazeboNumber,
        fullName: primary.fullName,
        phone: primary.phone.replace(/\D/g, ''),
        notes: `REQUESTED GAZEBO: #${gazeboNumber}\nConcierge Notes: ${notes}\n\n--- ${validAttendees.length} MEMBER DETAILS ---\n${membersNotes}`,
      };

      const res = await fetch(`${API_BASE}/gazebo-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${otpToken}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setOtpModalOpen(false);
        setIsSuccess(true);
      } else {
        setOtpError(data.message || data.error?.message || 'Failed to submit inquiry.');
      }
    } catch (err: any) {
      setOtpError('An error occurred during submission.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError(null);
    setOtpCode('');
    setOtpDigits(['', '', '', '', '', '']);
    
    const primaryPhone = attendees[0].phone.replace(/\D/g, '');

    try {
      const res = await fetch(`${API_BASE}/auth/whatsapp-otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: primaryPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
      } else {
        setOtpError(data.message || 'Failed to send WhatsApp OTP.');
      }
    } catch (err) {
      setOtpError('Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl p-10 text-center shadow-xl border border-[#EAD9B8]">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#2D1F0E] mb-4">Reservation Requested</h2>
          <p className="text-[#6E5336] leading-relaxed mb-8">
            Thank you, <strong className="text-[#2D1F0E]">{attendees[0].fullName}</strong>. Your reservation inquiry for 
            <strong> Gazebo #{gazeboNumber}</strong> has been received securely with {attendees.filter(a => a.fullName).length} guest(s). Our concierge team will review your details and contact you shortly on WhatsApp.
          </p>
          <Link href="/">
            <button className="px-8 py-3.5 rounded-full bg-[#2D1F0E] text-[#F6C85F] font-bold text-sm tracking-widest uppercase hover:bg-[#1A1208] transition shadow-lg w-full">
              Return to Homepage
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D1F0E] font-sans selection:bg-[#D99427] selection:text-white relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#FFF5DC] to-[#FDFBF7] pointer-events-none z-0" />

      <main className="relative z-10 container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#FAF6EE] border border-[#EAD9B8] mb-4">
            <Crown className="w-4 h-4 text-[#D99427]" />
            <span className="text-xs font-mono font-bold tracking-widest text-[#8C6019] uppercase">
              14-Member VIP Gazebo Booking
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#2D1F0E] mb-4">
            Gazebo Reservation
          </h1>
          <p className="text-sm md:text-base text-[#6E5336] max-w-xl mx-auto leading-relaxed">
            Submit your VIP details securely. Select a Gazebo and enter details for up to 14 guests.
            Aadhaar verification is highly recommended for faster processing.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-8 bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-[#EAD9B8]">
          
          {/* Section: Gazebo Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-[#2D1F0E] flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-[#D99427]" />
              <span>1. Select Gazebo (1-14) *</span>
            </h3>
            <div className="relative">
              <select
                value={gazeboNumber || ''}
                onChange={(e) => setGazeboNumber(Number(e.target.value))}
                className="w-full px-4 py-4 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-sm md:text-base font-bold focus:border-[#D99427] outline-none transition appearance-none cursor-pointer"
              >
                <option value="" disabled>-- Choose a Gazebo --</option>
                {Array.from({ length: 14 }).map((_, i) => (
                  <option key={`gz-${i + 1}`} value={i + 1}>Gazebo #{i + 1}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#8C6019]">
                ▼
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-[#EAD9B8]/50" />

          {/* Section: 14 Attendees */}
          <div className="space-y-8">
            <h3 className="text-lg font-serif font-bold text-[#2D1F0E] flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#D99427]" />
              <span>2. Guest Details (Up to 14 Members)</span>
            </h3>

            {attendees.map((attendee, index) => (
              <div key={`attendee-${index}`} className={`p-5 rounded-2xl border-2 transition-all ${
                index === 0 ? 'border-[#D99427]/40 bg-[#FFFDF9]' : 'border-[#EAD9B8]/50 bg-[#FAF6EE]/50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-[#D99427] text-white' : 'bg-[#EAD9B8] text-[#6E5336]'
                    }`}>
                      {index + 1}
                    </div>
                    <h4 className="font-bold text-[#2D1F0E]">
                      Guest {index + 1} {index === 0 && '*'}
                    </h4>
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newAtt = [...attendees];
                        newAtt.splice(index, 1);
                        setAttendees(newAtt);
                      }}
                      className="text-rose-500 hover:text-rose-700 text-sm font-bold flex items-center transition"
                    >
                      <X className="w-4 h-4 mr-1" /> Remove
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  {/* KYC Upload */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-2">
                      Aadhaar Upload (Auto-Fills Details)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Front Side */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(e) => handleAadhaarUpload(e, index, 'FRONT')}
                          className="hidden"
                          id={`aadhaar-front-${index}`}
                        />
                        <label
                          htmlFor={`aadhaar-front-${index}`}
                          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                            attendee.frontUploaded
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                              : 'border-[#EAD9B8] bg-white hover:bg-[#F3ECE0] text-[#8C6019]'
                          }`}
                        >
                          <Upload className={`w-4 h-4 mb-1.5 ${attendee.frontUploaded ? 'text-emerald-500' : 'text-[#D99427]'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {attendee.frontUploading ? 'Scanning...' : attendee.frontUploaded ? 'Front Uploaded ✓' : 'Front Side'}
                          </span>
                        </label>
                      </div>

                      {/* Back Side */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(e) => handleAadhaarUpload(e, index, 'BACK')}
                          className="hidden"
                          id={`aadhaar-back-${index}`}
                        />
                        <label
                          htmlFor={`aadhaar-back-${index}`}
                          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                            attendee.backUploaded
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                              : 'border-[#EAD9B8] bg-white hover:bg-[#F3ECE0] text-[#8C6019]'
                          }`}
                        >
                          <Upload className={`w-4 h-4 mb-1.5 ${attendee.backUploaded ? 'text-emerald-500' : 'text-[#D99427]'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {attendee.backUploading ? 'Scanning...' : attendee.backUploaded ? 'Back Uploaded ✓' : 'Back Side'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1.5">
                        Full Name {index === 0 && '*'}
                      </label>
                      <input
                        type="text"
                        value={attendee.fullName}
                        onChange={(e) => updateAttendee(index, 'fullName', e.target.value)}
                        placeholder="e.g. Vikramaditya Solanki"
                        className="w-full px-3 py-2.5 rounded-lg bg-white border border-[#EAD9B8] text-[#2D1F0E] text-sm focus:border-[#D99427] outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1.5">
                        12-Digit Aadhaar {index === 0 && '*'}
                      </label>
                      <input
                        type="text"
                        value={formatAadhaarNumber(attendee.aadhaarNumber)}
                        onChange={(e) => updateAttendee(index, 'aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                        placeholder="1234 5678 9012"
                        className="w-full px-3 py-2.5 rounded-lg bg-white border border-[#EAD9B8] text-[#2D1F0E] text-sm font-mono focus:border-[#D99427] outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1.5">
                        WhatsApp Number {index === 0 && '*'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-[#8C6019] text-sm font-bold">+91</span>
                        </div>
                        <input
                          type="text"
                          value={formatPhoneNumber(attendee.phone)}
                          onChange={(e) => updateAttendee(index, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="98765 43210"
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white border border-[#EAD9B8] text-[#2D1F0E] text-sm font-mono focus:border-[#D99427] outline-none transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1.5">
                        Email Address {index === 0 && '*'}
                      </label>
                      <input
                        type="email"
                        value={attendee.email}
                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3 py-2.5 rounded-lg bg-white border border-[#EAD9B8] text-[#2D1F0E] text-sm focus:border-[#D99427] outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {attendees.length < 14 && (
              <button
                type="button"
                onClick={() => {
                  setAttendees([...attendees, {
                    fullName: '',
                    phone: '',
                    email: '',
                    aadhaarNumber: '',
                    frontUploaded: false,
                    backUploaded: false,
                    frontUploading: false,
                    backUploading: false,
                  }]);
                }}
                className="w-full py-4 rounded-xl border-2 border-dashed border-[#D99427] text-[#D99427] font-bold text-sm tracking-widest uppercase hover:bg-[#FDFBF7] transition flex items-center justify-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Add Guest {attendees.length + 1}</span>
              </button>
            )}
          </div>

          <div className="w-full h-px bg-[#EAD9B8]/50" />

          {/* Section: Additional Notes */}
          <div>
            <label className="block text-[11px] font-bold text-[#6E5336] uppercase tracking-wider mb-1.5">
              Special Requests / Concierge Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Need VIP parking assistance, catering..."
              className="w-full px-4 py-3 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] text-sm focus:border-[#D99427] outline-none transition resize-none"
            />
          </div>

          <div className="w-full h-px bg-[#EAD9B8]/50" />

          {/* Terms and Conditions */}
          <div className="space-y-4 bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAD9B8]">
            <label className="flex items-start space-x-4 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 appearance-none rounded border border-gray-400 checked:border-[#D99427] checked:bg-[#D99427] transition-colors cursor-pointer"
                />
                {termsAccepted && <CheckCircle2 className="w-4 h-4 text-white absolute pointer-events-none" />}
              </div>
              <div className="flex flex-col select-none">
                <span className="text-sm text-[#2D1F0E] font-bold">
                  I agree to the Safed Sheri 2026 Terms & Conditions
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowTerms(!showTerms); }}
                  className="text-[#D99427] text-xs font-bold text-left hover:underline mt-1"
                >
                  Read More
                </button>
              </div>
            </label>

            {showTerms && <TermsAndConditionsContent />}
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-sm tracking-widest uppercase hover:opacity-95 transition shadow-[0_10px_30px_rgba(217,148,39,0.3)] flex items-center justify-center space-x-2"
          >
            <span>Proceed to Verify WhatsApp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* OTP Modal */}
        {otpModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2D1F0E]/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#FDFBF7] border border-[#EAD9B8] rounded-3xl w-full max-w-md p-8 shadow-2xl relative text-center">
              <button
                onClick={() => setOtpModalOpen(false)}
                disabled={otpLoading}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#FAF6EE] text-[#6E5336] hover:text-[#2D1F0E] flex items-center justify-center border border-[#EAD9B8]"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 bg-[#FFF5DC] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EAD9B8]">
                <Phone className="w-8 h-8 text-[#D99427]" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#2D1F0E] mb-2">WhatsApp Security</h3>
              
              <div className="text-sm text-[#6E5336] mb-6">
                We have sent a 6-digit WhatsApp OTP verification code to:
                <strong className="text-[#2D1F0E] block mt-1 text-lg tracking-wide">+91 {formatPhoneNumber(attendees[0].phone)}</strong>
              </div>

              {otpError && (
                <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{otpError}</span>
                </div>
              )}

              <div className="flex justify-center space-x-2 mb-6">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={`otp-${idx}`}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(e.target.value.replace(/\D/g, ''), idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    disabled={otpLoading}
                    className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-mono font-bold rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E] focus:border-[#D99427] focus:ring-1 focus:ring-[#D99427] outline-none transition disabled:opacity-50"
                  />
                ))}
              </div>

              <div className="text-xs text-[#6E5336] mb-8 font-medium">
                <span>Didn't receive the OTP? </span>
                <button
                  onClick={handleResendOtp}
                  disabled={otpLoading}
                  className="text-[#D99427] font-bold hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otpCode.length !== 6}
                className="w-full py-4 rounded-xl bg-[#2D1F0E] text-[#F6C85F] font-bold text-sm tracking-widest uppercase hover:bg-[#1A1208] transition shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {otpLoading ? <span className="animate-pulse">Verifying...</span> : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Verify & Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
