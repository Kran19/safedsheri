const fs = require('fs');
const file = 'd:/safedsheri/apps/admin/app/LandingPageClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Link import if not present
if (!content.includes("from 'next/link'")) {
  content = content.replace("import Image from 'next/image';", "import Image from 'next/image';\nimport Link from 'next/link';");
}

// 2. Replace Terms & Conditions button
const termsButton = `<button onClick={() => { setShowFooterTerms(true); garbaAudio.playDandiya(); }} className="hover:underline transition cursor-pointer z-20 relative">Terms & Conditions</button>`;
const newTermsLink = `<Link href="/terms-and-conditions" onClick={() => garbaAudio.playDandiya()} className="hover:underline transition cursor-pointer z-20 relative">Terms & Conditions</Link>`;
content = content.replace(termsButton, newTermsLink);
content = content.replace(termsButton.replace('&', '&amp;'), newTermsLink);

// 3. Replace Privacy Policy button
const privacyButton = `<button onClick={() => { setShowPrivacyPolicy(true); garbaAudio.playDandiya(); }} className="hover:underline transition cursor-pointer z-20 relative">Privacy Policy</button>`;
const newPrivacyLink = `<Link href="/privacy-policy" onClick={() => garbaAudio.playDandiya()} className="hover:underline transition cursor-pointer z-20 relative">Privacy Policy</Link>`;
content = content.replace(privacyButton, newPrivacyLink);

// Try replacing with different quotes or spacing if exact match fails
if (content.includes('setShowFooterTerms(true)')) {
  // We'll just do a regex replace to be safe
  content = content.replace(/<button[^>]*onClick=\{\(\) => \{ setShowFooterTerms\(true\);[^>]*>Terms &amp; Conditions<\/button>/g, newTermsLink);
  content = content.replace(/<button[^>]*onClick=\{\(\) => \{ setShowPrivacyPolicy\(true\);[^>]*>Privacy Policy<\/button>/g, newPrivacyLink);
}

fs.writeFileSync(file, content);
console.log('Footer patched');
