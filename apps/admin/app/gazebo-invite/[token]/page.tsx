'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import LogoSlot from '../../components/LogoSlot';
import { 
  Users, UserPlus, Crown, Sparkles, CheckCircle2, AlertCircle, 
  ArrowRight, Phone, ShieldCheck, Mail, User, Info, KeyRound
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AttendeeForm {
  fullName: string;
  phone: string;
  email: string;
  gender: 'MALE' | 'FEMALE';
  aadhaarNumber: string;
  documentFrontKey?: string;
  documentFrontName?: string;
  documentBackKey?: string;
  documentBackName?: string;
  isUploadingFront?: boolean;
  isUploadingBack?: boolean;
  uploadError?: string;
}

export default function GazeboInvitePage() {
  const { token } = useParams();
  const [gazebo, setGazebo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [attendees, setAttendees] = useState<AttendeeForm[]>([
    { fullName: '', phone: '', email: '', gender: 'MALE', aadhaarNumber: '' }
  ]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successPasses, setSuccessPasses] = useState<any[] | null>(null);

  // WhatsApp OTP Verification States
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [isBypassed, setIsBypassed] = useState(false);

  // Load Invite Details
  useEffect(() => {
    if (!token) return;
    async function loadInvite() {
      try {
        const res = await apiRequest(`/auth/gazebo-invite/${token}`);
        if (res.success && res.data) {
          setGazebo(res.data);
        } else {
          setError(res.error?.message || 'This invitation link is invalid or has expired.');
        }
      } catch (err: any) {
        setError('Failed to fetch invitation details. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  // Aadhaar File Upload Handler
  const handleAadhaarUpload = async (index: number, side: 'front' | 'back', file: File) => {
    if (!file) return;
    setAttendees(prev => {
      const copy = [...prev];
      if (side === 'front') copy[index].isUploadingFront = true;
      if (side === 'back') copy[index].isUploadingBack = true;
      copy[index].uploadError = undefined;
      return copy;
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('side', side);

      const res = await fetch(`/api/v1/uploads/aadhaar/extract`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to extract Aadhaar data');
      }

      setAttendees(prev => {
        const copy = [...prev];
        if (side === 'front') {
          copy[index].isUploadingFront = false;
          if (json.success && json.data) {
            copy[index].documentFrontKey = json.data.storageKey || json.data.id || file.name;
            copy[index].documentFrontName = file.name;
          }
          if (json.extractedData) {
            const ex = json.extractedData;
            if (ex.name) copy[index].fullName = ex.name;
            if (ex.aadhaarNumber) copy[index].aadhaarNumber = ex.aadhaarNumber;
            if (ex.gender) copy[index].gender = ex.gender === 'MALE' ? 'MALE' : 'FEMALE';
          }
        } else if (side === 'back') {
          copy[index].isUploadingBack = false;
          if (json.success && json.data) {
            copy[index].documentBackKey = json.data.storageKeyBack || json.data.id || file.name;
            copy[index].documentBackName = file.name;
          }
        }
        return copy;
      });
    } catch (err: any) {
      setAttendees(prev => {
        const copy = [...prev];
        if (side === 'front') copy[index].isUploadingFront = false;
        if (side === 'back') copy[index].isUploadingBack = false;
        copy[index].uploadError = err.message || 'AI extraction failed. Please fill details manually.';
        return copy;
      });
    }
  };

  const addGuest = () => {
    if (attendees.length >= 14) return;
    setAttendees([...attendees, { fullName: '', phone: '', email: '', gender: 'MALE', aadhaarNumber: '' }]);
  };

  const removeGuest = (index: number) => {
    if (attendees.length <= 1) return;
    const updated = [...attendees];
    updated.splice(index, 1);
    setAttendees(updated);
  };

  const updateGuest = (index: number, field: keyof AttendeeForm, value: string) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value } as AttendeeForm;
    setAttendees(updated);
  };

  // OTP Digits input handler
  const handleDigitChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.substring(val.length - 1);
    setOtpDigits(newDigits);
    setOtpCode(newDigits.join(''));

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newDigits = [...otpDigits];
      if (!otpDigits[index] && index > 0) {
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        setOtpCode(newDigits.join(''));
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  // Step 1: Initiate verification
  const handleVerifyStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate fields
    if (attendees.some(a => !a.fullName || !a.phone || !a.gender || !a.aadhaarNumber)) {
      setSubmitError('Full Name, Phone, Gender, and Aadhaar are required for all guests.');
      return;
    }

    const phones = attendees.map(a => a.phone.replace(/\D/g, ''));
    if (phones.some(p => p.length !== 10)) {
      setSubmitError('All Phone numbers must be exactly 10 digits.');
      return;
    }

    const aadhaars = attendees.map(a => a.aadhaarNumber.replace(/\D/g, ''));
    if (aadhaars.some(a => a.length !== 12)) {
      setSubmitError('All Aadhaar numbers must be exactly 12 digits.');
      return;
    }

    // Uniqueness
    const uniquePhones = new Set(phones);
    if (uniquePhones.size !== phones.length) {
      setSubmitError('Duplicate phone numbers are not allowed within the guests list.');
      return;
    }

    const uniqueAadhaars = new Set(aadhaars);
    if (uniqueAadhaars.size !== aadhaars.length) {
      setSubmitError('Duplicate Aadhaar numbers are not allowed within the guests list.');
      return;
    }

    const primaryPhone = attendees[0].phone;
    setOtpPhone(primaryPhone);

    try {
      setSubmitLoading(true);
      // Check if primary phone is in OTP bypass list
      const bypassCheck = await apiRequest(`/auth/otp-bypass-check/${primaryPhone.replace(/\D/g, '').slice(-10)}`);
      
      if (bypassCheck.success && bypassCheck.data?.bypassed) {
        setIsBypassed(true);
        // Direct Submit
        await handleFinalSubmission(null);
      } else {
        setIsBypassed(false);
        setOtpModalOpen(true);
        setOtpError(null);
        setOtpLoading(true);
        setOtpSent(false);
        setOtpCode('');
        setOtpDigits(['', '', '', '', '', '']);

        const res = await apiRequest('/auth/whatsapp-otp/send', {
          method: 'POST',
          body: JSON.stringify({ phone: primaryPhone }),
        });

        if (res.success) {
          setOtpSent(true);
        } else {
          setOtpError(res.message || 'Failed to send WhatsApp OTP.');
        }
      }
    } catch (err: any) {
      setSubmitError('Verification setup failed. Please try again.');
    } finally {
      setSubmitLoading(false);
      setOtpLoading(false);
    }
  };

  // Step 2: Confirm OTP
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await apiRequest('/auth/whatsapp-otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: otpPhone, code: otpCode }),
      });

      if (res.success && res.data?.otpToken) {
        setOtpToken(res.data.otpToken);
        setOtpModalOpen(false);
        await handleFinalSubmission(res.data.otpToken);
      } else {
        setOtpError(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setOtpError('Failed to verify OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Final Submit to DB
  const handleFinalSubmission = async (tokenToUse: string | null) => {
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const res = await apiRequest(`/auth/gazebo-invite/${token}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          attendees,
          otpToken: tokenToUse,
        }),
      });

      if (res.success && res.data) {
        setSuccessPasses(res.data);
      } else {
        setSubmitError(res.message || 'Failed to submit guest details.');
      }
    } catch (err: any) {
      setSubmitError('Connection failed. Ensure API service is reachable.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError(null);
    setOtpCode('');
    setOtpDigits(['', '', '', '', '', '']);

    try {
      const res = await apiRequest('/auth/whatsapp-otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone: otpPhone }),
      });

      if (res.success) {
        setOtpSent(true);
      } else {
        setOtpError(res.message || 'Failed to send WhatsApp OTP.');
      }
    } catch (err: any) {
      setOtpError('Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] text-[#FFF5DC] flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D99427] mb-4"></div>
        <div className="font-serif italic text-lg text-[#F6C85F]">Entering Safed Sheri VIP Portal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070707] text-[#FFFDF9] flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-[#111] border-2 border-red-950 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-950/40 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-red-500">Invitation Unresolved</h2>
          <p className="text-xs text-[#A8927A] leading-relaxed">{error}</p>
          <div className="pt-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#8C6019] block mb-2">SAFED SHERI 2026</span>
            <LogoSlot size="sm" />
          </div>
        </div>
      </div>
    );
  }

  const levelName = gazebo.level === 1 ? 'Sheri Chowk' : gazebo.level === 2 ? 'The Royal Sheri Pavillion' : 'Sheri Rass';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F0F] via-[#151515] to-[#0A0A0A] text-[#FFFDF9] flex flex-col justify-center items-center py-12 px-4 selection:bg-[#F6C85F]/50">
      <div className="max-w-4xl w-full space-y-8 animate-fade-in">
        
        {/* Banner Card Header */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#171717] to-[#121212] border-2 border-[#D99427]/60 shadow-2xl relative overflow-hidden text-center md:text-left md:flex md:justify-between md:items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-[#D99427]/10 to-transparent pointer-events-none rounded-full" />
          <div className="space-y-3 z-10 relative">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#D99427]/15 border border-[#D99427]/40 text-[9px] font-extrabold text-[#F6C85F] uppercase tracking-widest">
              <Crown className="w-3 h-3 text-[#F6C85F]" />
              <span>VIP Invitation Confirmed</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-[#FFF5DC]">Gazebo {gazebo.gazeboNumber} Lounge</h1>
            <p className="text-xs text-[#A8927A] max-w-lg leading-relaxed">
              Allocated at level <strong className="text-[#F6C85F]">{levelName} (Level {gazebo.level})</strong>. 
              As the VIP guest of <strong className="text-[#FFF5DC]">{gazebo.hostName}</strong>, please submit the full details of all 14 group members below to activate your premium entry passes.
            </p>
          </div>
          <div className="flex justify-center md:justify-end mt-4 md:mt-0 flex-shrink-0 z-10 relative">
            <LogoSlot size="md" />
          </div>
        </div>

        {successPasses ? (
          /* Success Screen */
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-[#121212] border border-[#EAD9B8]/20 shadow-2xl text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto border border-emerald-500/50">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-emerald-500">Successfully Registered!</h3>
              <p className="text-xs text-[#A8927A] max-w-md mx-auto leading-relaxed">
                Passes have been successfully minted and linked to Gazebo {gazebo.gazeboNumber}. They are active and ready for entry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {successPasses.map((p, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0A0A0A] border-2 border-[#D99427]/60 text-[#F6C85F] relative overflow-hidden shadow-xl">
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute -top-[50%] -left-[20%] w-[150%] h-[150%] rounded-full border-[1px] border-[#D99427] opacity-20 transform -rotate-45" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-md bg-[#D99427]/10">
                        <Sparkles className="w-4 h-4 text-[#F6C85F]" />
                      </div>
                      <div>
                        <div className="text-sm font-serif font-bold tracking-wider">GAZEBO®</div>
                        <div className="text-[6px] tracking-widest opacity-60 uppercase">VIP Lounge Pass</div>
                      </div>
                    </div>

                    <div className="py-1.5 border-t border-b border-[#D99427]/20 text-left">
                      <div className="text-lg font-serif font-bold text-[#FFF5DC]">{p.attendeeName}</div>
                      <div className="text-[9px] tracking-[0.2em] font-medium text-[#D99427] uppercase mt-0.5">VIP ALL ACCESS</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left text-[10px]">
                      <div>
                        <span className="opacity-50 block uppercase text-[7px]">Pass Code</span>
                        <span className="font-mono font-bold">{p.credential.passCode}</span>
                      </div>
                      <div>
                        <span className="opacity-50 block uppercase text-[7px]">Valid Date</span>
                        <span className="font-mono font-bold">09 OCT 2026</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="p-1 bg-white rounded-lg">
                        <QRCodeSVG value={p.credential.secureToken} size={50} level="M" />
                      </div>
                      <span className="text-[9px] font-serif italic opacity-75 text-[#D99427]">Safed Sheri 2026</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleVerifyStart} className="space-y-6">
            {submitError && (
              <div className="p-4 bg-red-950/60 border border-red-800 text-red-500 rounded-2xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex justify-between items-center bg-[#151515] p-5 rounded-3xl border border-white/5">
              <span className="text-sm font-bold text-[#A8927A]">
                Total Registered Guests: <strong className="text-[#FFF5DC]">{attendees.length} / 14</strong>
              </span>
              <button
                type="button"
                onClick={addGuest}
                disabled={attendees.length >= 14 || submitLoading}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-[#F6C85F] text-xs font-bold rounded-xl transition flex items-center space-x-2 disabled:opacity-30"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Guest</span>
              </button>
            </div>

            <div className="space-y-5">
              {attendees.map((att, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-[#111] border border-white/5 shadow-lg relative space-y-4">
                  {attendees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGuest(idx)}
                      disabled={submitLoading}
                      className="absolute top-6 right-6 text-red-400 hover:text-red-500 text-xs font-semibold transition"
                    >
                      ✕ Remove
                    </button>
                  )}
                  <h4 className="text-xs font-extrabold text-[#FFF5DC] uppercase flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#D99427] text-[#070707] flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                    <span>Guest Details</span>
                  </h4>

                  {/* Aadhaar Upload Card */}
                  <div className="p-4 bg-[#151515] rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-[#A8927A] uppercase">Aadhaar Card Upload (Auto-Fills Details via AI OCR)</span>
                      <span className="text-[8px] font-mono text-[#D99427] bg-[#D99427]/10 px-2 py-0.5 rounded border border-[#D99427]/20">OCR ENABLED</span>
                    </div>

                    {att.uploadError && (
                      <span className="text-[10px] text-red-500 font-semibold block">{att.uploadError}</span>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Front Upload */}
                      <div className="border border-dashed border-[#D99427]/30 rounded-2xl p-4 bg-[#0F0F0F] text-center hover:bg-[#151515] transition">
                        <div className="text-[9px] font-bold text-[#A8927A] mb-2 uppercase">Aadhaar Front Side *</div>
                        <input
                          type="file"
                          accept="image/*"
                          id={`front-upload-${idx}`}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleAadhaarUpload(idx, 'front', e.target.files[0]);
                          }}
                        />
                        <label
                          htmlFor={`front-upload-${idx}`}
                          className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#1A1A1A] border border-white/5 text-[11px] font-bold text-[#FFF5DC] hover:border-[#D99427] transition"
                        >
                          {att.isUploadingFront ? (
                            <span className="animate-pulse text-[#D99427]">Analyzing Document...</span>
                          ) : att.documentFrontKey ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500 truncate max-w-[120px]">{att.documentFrontName}</span>
                            </>
                          ) : (
                            <span>Upload Front</span>
                          )}
                        </label>
                      </div>

                      {/* Back Upload */}
                      <div className="border border-dashed border-[#D99427]/30 rounded-2xl p-4 bg-[#0F0F0F] text-center hover:bg-[#151515] transition">
                        <div className="text-[9px] font-bold text-[#A8927A] mb-2 uppercase">Aadhaar Back Side</div>
                        <input
                          type="file"
                          accept="image/*"
                          id={`back-upload-${idx}`}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleAadhaarUpload(idx, 'back', e.target.files[0]);
                          }}
                        />
                        <label
                          htmlFor={`back-upload-${idx}`}
                          className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#1A1A1A] border border-white/5 text-[11px] font-bold text-[#FFF5DC] hover:border-[#D99427] transition"
                        >
                          {att.isUploadingBack ? (
                            <span className="animate-pulse">Uploading...</span>
                          ) : att.documentBackKey ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500 truncate max-w-[120px]">{att.documentBackName}</span>
                            </>
                          ) : (
                            <span>Upload Back</span>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#A8927A] uppercase mb-1.5">Full Name *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={att.fullName}
                          onChange={(e) => updateGuest(idx, 'fullName', e.target.value)}
                          className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[#151515] border border-white/5 text-xs text-[#FFF5DC] focus:border-[#D99427] outline-none"
                          placeholder="Full Name"
                        />
                        <User className="w-3.5 h-3.5 text-[#8C6019] absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#A8927A] uppercase mb-1.5">WhatsApp Mobile *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={att.phone}
                          onChange={(e) => updateGuest(idx, 'phone', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[#151515] border border-white/5 text-xs text-[#FFF5DC] focus:border-[#D99427] outline-none"
                          placeholder="10-digit phone"
                        />
                        <Phone className="w-3.5 h-3.5 text-[#8C6019] absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#A8927A] uppercase mb-1.5">Gender *</label>
                      <select
                        value={att.gender}
                        onChange={(e) => updateGuest(idx, 'gender', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#151515] border border-white/5 text-xs text-[#FFF5DC] focus:border-[#D99427] outline-none"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#A8927A] uppercase mb-1.5">Aadhaar Number *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={12}
                          value={att.aadhaarNumber}
                          onChange={(e) => updateGuest(idx, 'aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[#151515] border border-white/5 text-xs text-[#FFF5DC] focus:border-[#D99427] outline-none"
                          placeholder="12-digit number"
                        />
                        <ShieldCheck className="w-3.5 h-3.5 text-[#8C6019] absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-[#111] border border-white/5 rounded-3xl flex justify-end space-x-4">
              <button
                type="submit"
                disabled={submitLoading}
                className="px-8 py-3.5 rounded-2xl bg-[#2D1F0E] text-[#F6C85F] font-bold text-xs uppercase tracking-wider hover:bg-[#4A351B] transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                {submitLoading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <span>Verify & Activate VIP Passes</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* OTP Verification Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#111] max-w-md w-full rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-white/5">
            <div className="w-16 h-16 bg-[#D99427]/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-[#D99427]/20">
              <Phone className="w-8 h-8 text-[#D99427]" />
            </div>

            <h3 className="text-2xl font-serif font-bold text-[#FFF5DC]">Verify Phone Number</h3>
            
            <p className="text-xs text-[#A8927A] leading-relaxed">
              We have sent a 6-digit WhatsApp OTP verification code to the primary guest phone number: 
              <strong className="text-[#FFF5DC] block mt-1">+91 {otpPhone}</strong>
            </p>

            {otpError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-500 rounded-xl text-[11px] font-semibold">
                {otpError}
              </div>
            )}

            {/* 6 Digits Inputs */}
            <div className="flex justify-center space-x-2 py-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  disabled={otpLoading}
                  className="w-12 h-12 text-center rounded-xl bg-[#151515] border border-white/10 text-xl font-mono text-[#F6C85F] focus:border-[#D99427] outline-none"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-[#A8927A] pt-2">
              <span>Didn't receive the OTP?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpLoading}
                className="text-[#F6C85F] font-bold hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                disabled={otpLoading}
                className="flex-1 py-3 rounded-xl border border-white/5 bg-[#151515] text-[#A8927A] text-xs font-bold hover:bg-[#1c1c1c] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpLoading || otpCode.length !== 6}
                className="flex-1 py-3 rounded-xl bg-[#2D1F0E] text-[#F6C85F] text-xs font-bold hover:bg-[#4A351B] transition disabled:opacity-40"
              >
                {otpLoading ? 'Verifying...' : 'Verify & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
