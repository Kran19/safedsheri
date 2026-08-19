const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

// We will target only the modal wrapper section.
// The easiest way is to split the code at "MODAL 1: GUEST REGISTRATION" 
// and only replace in that bottom section so we don't ruin the landing page text.
const parts = code.split('MODAL 1: GUEST REGISTRATION');
if (parts.length > 1) {
  let modalCode = parts[1];

  // 1. Change text-[#2D1F0E] to text-white
  modalCode = modalCode.replace(/text-\[\#2D1F0E\]/g, 'text-white');
  
  // 2. Change text-[#6E5336] to text-white/80
  modalCode = modalCode.replace(/text-\[\#6E5336\]/g, 'text-white/80');

  // 3. Change text-[#8C6019] to a brighter gold text-[#F6C85F]
  modalCode = modalCode.replace(/text-\[\#8C6019\]/g, 'text-[#F6C85F]');

  // 4. Change border-[#EAD9B8] (brownish border) to border-white/30 
  // so the inner boxes don't have ugly brown borders on dark background.
  // Wait, I already changed some, but let's catch any remaining.
  modalCode = modalCode.replace(/border-\[\#EAD9B8\]/g, 'border-white/30');

  // 5. Change bg-[#FAF6EE] and bg-[#F8F5EE] to bg-white/20 (semi-transparent)
  modalCode = modalCode.replace(/bg-\[\#FAF6EE\]/g, 'bg-white/20');
  modalCode = modalCode.replace(/bg-\[\#F8F5EE\]/g, 'bg-white/20');
  modalCode = modalCode.replace(/bg-\[\#F8F3E8\]/g, 'bg-white/20');
  modalCode = modalCode.replace(/bg-\[\#FFFDF9\]/g, 'bg-white/20');
  modalCode = modalCode.replace(/bg-white/g, 'bg-white/10'); // Make purely white boxes transparent
  // Restore bg-white/10/20... to not become bg-white/10/20 (this regex is safe if we don't mess up existing white/X)
  modalCode = modalCode.replace(/bg-white\/10\/([0-9]+)/g, 'bg-white/$1');

  // 6. Fix "Total: ₹3,500" which is text-[#D99427]. It is visible but maybe we want it brighter.
  modalCode = modalCode.replace(/text-\[\#D99427\]/g, 'text-[#F6C85F]');

  // Reassemble
  code = parts[0] + 'MODAL 1: GUEST REGISTRATION' + modalCode;
  
  // Fix any double replacements like bg-white/10/20 just in case
  code = code.replace(/bg-white\/10\/([0-9]+)/g, 'bg-white/$1');

  fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
  console.log('Text colors fixed for dark background.');
}
