import React, { useState } from 'react';
import { Users, UserPlus, X, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';

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

export default function GazeboManageGuestsModal({ gazebo, onClose, onSuccess }: { gazebo: any, onClose: () => void, onSuccess: () => void }) {
  const [attendees, setAttendees] = useState<AttendeeForm[]>([
    { fullName: '', phone: '', email: '', gender: 'MALE', aadhaarNumber: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any[] | null>(null);

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
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };

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
        copy[index].uploadError = err.message || 'Failed to extract Aadhaar data. Please fill details manually.';
        return copy;
      });
    }
  };

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (attendees.some(a => !a.fullName || !a.phone || !a.gender || !a.aadhaarNumber)) {
      setError('Full Name, Phone, Gender, and Aadhaar are required for all guests.');
      return;
    }

    // Phone number validation
    const phones = attendees.map(a => a.phone.replace(/\D/g, ''));
    if (phones.some(p => p.length !== 10)) {
      setError('All Phone numbers must be exactly 10 digits.');
      return;
    }

    // Aadhaar number validation
    const aadhaars = attendees.map(a => a.aadhaarNumber.replace(/\D/g, ''));
    if (aadhaars.some(a => a.length !== 12)) {
      setError('All Aadhaar numbers must be exactly 12 digits.');
      return;
    }

    // Uniqueness within the form
    const uniquePhones = new Set(phones);
    if (uniquePhones.size !== phones.length) {
      setError('Duplicate phone numbers are not allowed within the same Gazebo booking.');
      return;
    }

    const uniqueAadhaars = new Set(aadhaars);
    if (uniqueAadhaars.size !== aadhaars.length) {
      setError('Duplicate Aadhaar numbers are not allowed within the same Gazebo booking.');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmMint = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    setError(null);

    const res = await apiRequest(`/gazebos/${gazebo.id}/guests`, {
      method: 'POST',
      body: JSON.stringify({ attendees }),
    });

    setLoading(false);
    if (res.success) {
      setSuccessData(res.data);
    } else {
      setError(res.error?.message || 'Failed to add guests.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#FDFBF7] w-full max-w-4xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#EAD9B8] flex items-center justify-between sticky top-0 bg-[#FDFBF7] z-10 rounded-t-3xl">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFF5DC] border border-[#E5A93C] text-[10px] font-bold text-[#8C6019] uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5 text-[#D99427]" />
              <span>GAZEBO GUEST MANAGEMENT</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#2D1F0E]">Manage Guests for {gazebo.gazeboNumber}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full border border-[#EAD9B8] bg-white flex items-center justify-center text-[#6E5336] hover:bg-gray-50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {successData ? (
            <div className="text-center space-y-6 py-10">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#2D1F0E]">Successfully Minted {successData.length} Passes!</h3>
              <p className="text-[#6E5336]">The digital passes have been successfully minted and linked to Gazebo {gazebo.gazeboNumber}.</p>
              <button onClick={onSuccess} className="px-6 py-3 bg-[#2D1F0E] text-[#F6C85F] font-bold rounded-xl hover:bg-[#4A351B] transition">
                Return to Inventory
              </button>
            </div>
          ) : (
            <form id="gazebo-guests-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-xl text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center bg-[#FAF6EE] p-4 rounded-2xl border border-[#EAD9B8]">
                <div className="text-sm font-bold text-[#6E5336]">
                  Total Guests: {attendees.length} / 14
                </div>
                <button
                  type="button"
                  onClick={addGuest}
                  disabled={attendees.length >= 14}
                  className="px-4 py-2 bg-white border border-[#EAD9B8] text-[#2D1F0E] text-xs font-bold rounded-xl hover:border-[#D99427] transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Guest</span>
                </button>
              </div>

              <div className="space-y-4">
                {attendees.map((att, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white border border-[#EAD9B8] shadow-sm relative">
                    {attendees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuest(idx)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        ✕ Remove
                      </button>
                    )}
                    <h4 className="text-xs font-bold text-[#2D1F0E] uppercase mb-4 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-[#D99427] text-white flex items-center justify-center text-[10px]">{idx + 1}</span>
                      <span>Guest Details</span>
                    </h4>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-[#6E5336] uppercase">Upload Aadhaar Card (Auto-Fills Details via AI OCR)</span>
                        <span className="text-[9px] font-mono text-[#D99427] bg-[#FAF6EE] px-2 py-0.5 rounded-md border border-[#EAD9B8]">AI OCR Enabled</span>
                      </div>
                      {att.uploadError && (
                        <div className="mb-2 text-[10px] text-red-600 font-semibold">{att.uploadError}</div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Front Upload */}
                        <div className="border border-dashed border-[#D99427]/60 rounded-xl p-3 bg-[#FAF6EE] text-center hover:bg-[#F3ECE0] transition">
                          <div className="text-[10px] font-bold text-[#6E5336] mb-1">Aadhaar Front (Photo & Name) *</div>
                          <input
                            type="file"
                            accept="image/*"
                            id={`gazebo-front-upload-${idx}`}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleAadhaarUpload(idx, 'front', e.target.files[0]);
                            }}
                          />
                          <label
                            htmlFor={`gazebo-front-upload-${idx}`}
                            className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EAD9B8] text-[11px] font-semibold text-[#2D1F0E] transition"
                          >
                            {att.isUploadingFront ? (
                              <span className="animate-pulse">Processing OCR...</span>
                            ) : att.documentFrontKey ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 truncate max-w-[120px]">{att.documentFrontName}</span>
                              </>
                            ) : (
                              <>
                                <span>Upload Front</span>
                              </>
                            )}
                          </label>
                        </div>

                        {/* Back Upload */}
                        <div className="border border-dashed border-[#D99427]/60 rounded-xl p-3 bg-[#FAF6EE] text-center hover:bg-[#F3ECE0] transition">
                          <div className="text-[10px] font-bold text-[#6E5336] mb-1">Aadhaar Back (Address Side)</div>
                          <input
                            type="file"
                            accept="image/*"
                            id={`gazebo-back-upload-${idx}`}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleAadhaarUpload(idx, 'back', e.target.files[0]);
                            }}
                          />
                          <label
                            htmlFor={`gazebo-back-upload-${idx}`}
                            className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EAD9B8] text-[11px] font-semibold text-[#2D1F0E] transition"
                          >
                            {att.isUploadingBack ? (
                              <span className="animate-pulse">Uploading...</span>
                            ) : att.documentBackKey ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 truncate max-w-[120px]">{att.documentBackName}</span>
                              </>
                            ) : (
                              <>
                                <span>Upload Back</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6E5336] uppercase mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={att.fullName}
                          onChange={(e) => updateGuest(idx, 'fullName', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6E5336] uppercase mb-1">WhatsApp Phone *</label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={att.phone}
                          onChange={(e) => updateGuest(idx, 'phone', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                          placeholder="10-digit number"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6E5336] uppercase mb-1">Gender *</label>
                        <select
                          value={att.gender}
                          onChange={(e) => updateGuest(idx, 'gender', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6E5336] uppercase mb-1">Aadhaar *</label>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          value={att.aadhaarNumber}
                          onChange={(e) => updateGuest(idx, 'aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#EAD9B8] text-xs focus:border-[#D99427] outline-none"
                          placeholder="12-digit Aadhaar"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!successData && (
          <div className="p-4 border-t border-[#EAD9B8] bg-[#FAF6EE] sticky bottom-0 rounded-b-3xl flex justify-end space-x-3 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-[#EAD9B8] bg-white text-[#6E5336] text-xs font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="gazebo-guests-form"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#2D1F0E] text-[#F6C85F] text-xs font-bold hover:bg-[#4A351B] transition flex items-center space-x-2"
            >
              {loading ? <span className="animate-pulse">Processing...</span> : <span>Confirm & Mint Passes</span>}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-6 text-center space-y-5 border border-[#EAD9B8]">
            <div className="w-16 h-16 bg-[#FFF5DC] rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-8 h-8 text-[#D99427]" />
            </div>
            
            <h3 className="text-xl font-serif font-bold text-[#2D1F0E]">Mint Passes?</h3>
            
            <p className="text-sm text-[#6E5336]">
              You are about to instantly mint digital passes for <strong className="text-[#2D1F0E]">{attendees.length}</strong> guest(s) to Gazebo {gazebo.gazeboNumber}.
            </p>

            {attendees.length < 14 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-left leading-relaxed">
                <strong>Notice:</strong> This Gazebo can hold up to 14 guests. You have only entered {attendees.length}. 
                Are you sure you want to proceed with a partial group? Unused capacity might be lost.
              </div>
            )}

            <div className="flex items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#EAD9B8] bg-white text-[#6E5336] text-xs font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMint}
                className="flex-1 py-2.5 rounded-xl bg-[#2D1F0E] text-[#F6C85F] text-xs font-bold hover:bg-[#4A351B] transition shadow-sm"
              >
                Proceed & Mint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
