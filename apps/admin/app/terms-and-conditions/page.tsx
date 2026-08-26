import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D1F0E] flex flex-col justify-between font-sans">
      <div className="py-16 md:py-20 px-6 max-w-4xl mx-auto w-full flex-1">
        <Link href="/" className="inline-flex items-center text-[#D99427] font-bold hover:underline mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
        </Link>
        <h1 className="text-4xl font-serif font-bold text-[#2D1F0E] mb-8 border-b-2 border-[#EAD9B8] pb-4">Terms & Conditions</h1>
        
        <div className="space-y-6 text-sm md:text-base leading-relaxed bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-[#EAD9B8]">
          <h5 className="text-lg font-bold text-[#D99427]">1. General Policies</h5>
          <p>
            Entry is strictly restricted to ticket holders. Passes are non-transferable and non-refundable under any circumstances, including cancellation of the event due to unforeseen conditions.
          </p>
          <p>
            We reserve the right to deny entry if any mismatch is found in your Aadhaar ID or verification documents at the entry gates.
          </p>
          <p>
            All passes (Single and Couple) are valid for the entire 9-day Navratri festival (October 9-17, 2026).
          </p>

          <h5 className="text-lg font-bold text-[#D99427] mt-8">2. Couple Pass Specifics</h5>
          <p>
            A Couple Pass strictly admits 1 Male and 1 Female. Both members must arrive together at the entry gate. Mismatched genders or attempts to transfer passes to others will result in immediate confiscation of the pass without refund.
          </p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">3. Gazebo & VIP Experience</h5>
          <p>
            Gazebos accommodate up to 20 guests. Catering services must be confirmed at least 24 hours in advance. Additional guests beyond the 20-person limit will require separate Single or Couple passes.
          </p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">4. Zero Tolerance Policy</h5>
          <p>
            Safed Sheri maintains a strict zero-tolerance policy against misconduct, harassment, or fighting. Security holds the right to evict any attendee exhibiting such behavior immediately and permanently.
          </p>
          <p>
            No outside food, beverages, alcohol, or illicit substances are permitted on the premises.
          </p>

          <h5 className="text-lg font-bold text-[#D99427] mt-8">5. Consent & Media</h5>
          <p>
            By attending Safed Sheri, you consent to being photographed and filmed. The organizers reserve the right to use this media for promotional and security purposes.
          </p>
          
          <p className="mt-8 pt-4 border-t border-[#EAD9B8] text-sm text-[#A3927B]">
            Safed Sheri is owned and operated by Sondarva Harish (Pan No: BFPPH9298G).<br />
            Address: HANUMAN CHOWK, SHERI 2, ANDHASHRAM PASE, JAMNAGAR, Gujarat 361006.
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
