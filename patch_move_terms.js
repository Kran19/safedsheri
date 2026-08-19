const fs = require('fs');

let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

const startStr = '<div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAD9B8] mt-6 text-left shadow-sm">';
let startIndex = code.indexOf(startStr);

if (startIndex === -1) {
  console.log("Could not find Terms block");
  process.exit(1);
}

let endIndex = code.indexOf('</div>', code.indexOf('VALID ID:', startIndex)) + 6;
// Add 4 more closing divs
for(let i=0; i<4; i++) {
  endIndex = code.indexOf('</div>', endIndex) + 6;
}

let termsBlock = code.substring(startIndex, endIndex);

// 1. Remove terms block from QUANTITY step
code = code.replace(termsBlock, '');

// 2. Remove disabled={!termsAccepted} from QUANTITY Continue button
code = code.replace(
  /onClick=\{handleNextStep\}\s*disabled=\{\!termsAccepted\}\s*className=\"w-full py-4 mt-6 rounded-2xl/g,
  'onClick={handleNextStep}\n                          className=\"w-full py-4 mt-6 rounded-2xl'
);

// 3. Insert terms block into ATTENDEE step
const newTermsBlock = `
                      {/* Terms and Conditions (Only show on first guest) */}
                      {currentAttendeeIndex === 0 && (
                        ${termsBlock}
                      )}
                      
                      {/* Navigation Bar */}`;

code = code.replace('{/* Navigation Bar */}', newTermsBlock);

// 4. Add disabled logic to ATTENDEE Next button
code = code.replace(
  /<button\s*type="button"\s*onClick=\{handleNextStep\}\s*className="px-8 py-3\.5 rounded-full bg-gradient-to-r from-\[\#F6C85F\] via-\[\#E5A93C\] to-\[\#D99427\] text-\[\#2D1F0E\] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-\[\#D99427\]\/20 flex items-center space-x-2 transition"/g,
  `<button
                          type="button"
                          onClick={handleNextStep}
                          disabled={currentAttendeeIndex === 0 && !termsAccepted}
                          className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-[#D99427]/20 flex items-center space-x-2 transition disabled:opacity-50"`
);

fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
console.log('Terms moved to Attendee step');
