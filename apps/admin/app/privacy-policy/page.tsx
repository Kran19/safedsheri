import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D1F0E] py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-[#D99427] font-bold hover:underline mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
        </Link>
        <h1 className="text-4xl font-serif font-bold text-[#2D1F0E] mb-8 border-b-2 border-[#EAD9B8] pb-4">Privacy Policy</h1>
        <div className="space-y-6 text-sm md:text-base leading-relaxed bg-white p-8 rounded-3xl shadow-sm border border-[#EAD9B8]">
          <p><strong>Last updated: August 25, 2026</strong></p>
          <p>Safed Sheri ("we," "us," or "our") operates the Safed Sheri service (the "Service"). This Privacy Policy outlines how we collect, use, and share your information through the services we provide.</p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">1. Information We Collect</h5>
          <p>We collect personal information that you voluntarily provide to us when you register for passes, including Name, Mobile Number, Gender, and Aadhaar Document images.</p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">2. How We Use Your Information</h5>
          <p>We use personal information collected via our website for a variety of business purposes, such as verifying identity via Aadhaar OCR for security and eligibility, managing your registrations, and facilitating event entry.</p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">3. Data Protection and Security</h5>
          <p>Aadhaar documents and personal data are strictly used for security screening and entry verification. We implement organizational and technical security measures designed to protect the security of any personal information we process.</p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">4. Data Sharing and Disclosure</h5>
          <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Your data is not sold to third parties.</p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">5. International Data Transfers</h5>
          <p>Your data may be transferred to and maintained on servers located outside of your region where data protection laws may differ from your jurisdiction. By using our Service, you consent to such transfers. We take steps to ensure your data receives adequate protection in accordance with this Privacy Policy.</p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">6. Data Retention</h5>
          <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your data, we will securely delete or anonymize it.</p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">7. Your Rights</h5>
          <p>Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to exercise these rights.</p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">8. Changes to This Privacy Policy</h5>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>
          
          <h5 className="text-lg font-bold text-[#D99427] mt-8">9. Contact Us</h5>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Email: safedsheri9@gmail.com</li>
            <li>Phone: +91 70169 77518</li>
            <li>Address: HANUMAN CHOWK, SHERI 2, ANDHASHRAM PASE, JAMNAGAR, Gujarat 361006</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
