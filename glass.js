const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

// 1. Outer Container
code = code.replace(
  /className=\"bg-white\/70 backdrop-blur-xl border border-white\/40 rounded-\[2\.5rem\] w-full max-w-3xl shadow-\[0_8px_32px_0_rgba\(0,0,0,0\.37\)\] relative z-10 text-\[\#2D1F0E\] p-6 sm:p-10 my-auto\"/,
  'className=\"bg-white/20 backdrop-blur-xl border border-white/30 rounded-[2.5rem] w-full max-w-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative z-10 text-[#2D1F0E] p-6 sm:p-10 my-auto\"'
);

// 2. Breadcrumb Container
code = code.replace(
  /className=\"flex items-center justify-between bg-\[\#F8F3E8\] p-3 sm:p-4 rounded-2xl border border-\[\#EAD9B8\]\"/,
  'className=\"flex items-center justify-between bg-white/20 p-3 sm:p-4 rounded-2xl border border-white/30 backdrop-blur-md\"'
);

// 3. Breadcrumb Buttons (unselected state)
code = code.replace(
  /bg-white text-\[\#6E5336\] border border-\[\#EAD9B8\]/g,
  'bg-white/40 text-[#6E5336] border border-white/40 backdrop-blur-sm'
);

// 4. Luxury Counter Box
code = code.replace(
  /className=\"p-8 rounded-3xl bg-gradient-to-b from-\[\#FFFDF9\] to-\[\#F8F3E8\] border-2 border-\[\#EAD9B8\] shadow-lg max-w-md mx-auto text-center space-y-6\"/g,
  'className=\"p-8 rounded-3xl bg-white/20 border border-white/30 backdrop-blur-md shadow-lg max-w-md mx-auto text-center space-y-6\"'
);

// 5. Counter Buttons (+ / -)
code = code.replace(
  /bg-white border border-\[\#EAD9B8\] hover:border-\[\#D99427\]/g,
  'bg-white/40 border border-white/40 hover:border-[#D99427] backdrop-blur-sm'
);

// 6. Phase Pricing Box
code = code.replace(
  /className=\"p-6 rounded-2xl bg-white border border-\[\#EAD9B8\] max-w-sm mx-auto text-center space-y-1 shadow-sm\"/g,
  'className=\"p-6 rounded-2xl bg-white/30 border border-white/30 backdrop-blur-md max-w-sm mx-auto text-center space-y-1 shadow-sm\"'
);

// 7. Terms & Conditions Box
code = code.replace(
  /className=\"p-6 rounded-2xl bg-white border border-\[\#EAD9B8\] max-w-md mx-auto text-left space-y-3 shadow-sm\"/g,
  'className=\"p-6 rounded-2xl bg-white/30 border border-white/30 backdrop-blur-md max-w-md mx-auto text-left space-y-3 shadow-sm\"'
);

// 8. Header Actions (Reset & Close Buttons)
code = code.replace(
  /className=\"px-3 py-1.5 rounded-full bg-\[\#FAF6EE\] hover:bg-\[\#F3ECE0\] border border-\[\#EAD9B8\] text-\[11px\] font-bold text-\[\#6E5336\] flex items-center space-x-1 transition\"/g,
  'className=\"px-3 py-1.5 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/30 text-[11px] font-bold text-[#6E5336] flex items-center space-x-1 transition\"'
);
code = code.replace(
  /className=\"w-9 h-9 rounded-full bg-\[\#F8F5EE\] text-\[\#6E5336\] hover:text-\[\#2D1F0E\] flex items-center justify-center border border-\[\#EAD9B8\] text-sm font-bold shadow-sm\"/g,
  'className=\"w-9 h-9 rounded-full bg-white/30 text-[#6E5336] hover:text-[#2D1F0E] hover:bg-white/50 backdrop-blur-sm flex items-center justify-center border border-white/30 text-sm font-bold shadow-sm\"'
);

// 9. Input boxes
code = code.replace(
  /className=\"flex-1 px-4 py-3 rounded-2xl bg-\[\#FAF6EE\] border border-\[\#EAD9B8\] text-\[\#2D1F0E\] text-xs focus:border-\[\#D99427\] outline-none transition\"/g,
  'className=\"flex-1 px-4 py-3 rounded-2xl bg-white/50 border border-white/40 text-[#2D1F0E] text-xs focus:border-[#D99427] outline-none transition backdrop-blur-sm\"'
);

fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
console.log('Glass applied successfully.');
