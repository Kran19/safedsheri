
const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

// Find the isBookingOpen block
const startIndex = code.indexOf('{isBookingOpen && (');
const endIndex = code.indexOf('{/* ========================================================================= */}', startIndex + 10);

if (startIndex !== -1 && endIndex !== -1) {
  let modalCode = code.substring(startIndex, endIndex);

  // Replace text colors
  modalCode = modalCode.replace(/text-\[\#2D1F0E\]/g, 'text-white');
  modalCode = modalCode.replace(/text-\[\#8C6019\]/g, 'text-[#F6C85F]');
  modalCode = modalCode.replace(/text-\[\#6E5336\]/g, 'text-white/80');
  modalCode = modalCode.replace(/border-\[\#EAD9B8\]/g, 'border-white/30');
  modalCode = modalCode.replace(/bg-\[\#FAF6EE\]/g, 'bg-white/10');
  modalCode = modalCode.replace(/bg-white/g, 'bg-white/10');
  
  code = code.substring(0, startIndex) + modalCode + code.substring(endIndex);
  fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
  console.log('Fixed modal colors');
} else {
  console.log('Could not find modal block');
}

