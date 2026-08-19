const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

if (!code.includes('const [showTerms, setShowTerms]')) {
  code = code.replace(
    'const [termsAccepted, setTermsAccepted] = useState(false);',
    'const [termsAccepted, setTermsAccepted] = useState(false);\n  const [showTerms, setShowTerms] = useState(false);'
  );
}

const startMarker = '{/* Terms and Conditions */}';
const startIdx = code.indexOf(startMarker);
if (startIdx === -1) {
  console.error('Could not find start marker');
  process.exit(1);
}

const buttonMarker = '<span>Continue to Guest Details</span>';
let endIdx = code.indexOf(buttonMarker, startIdx);
if (endIdx === -1) {
  console.error('Could not find end marker');
  process.exit(1);
}

// Rewind to the <button> tag just before the buttonMarker
const buttonStartIdx = code.lastIndexOf('<button', endIdx);

const blockToRemove = code.substring(startIdx, buttonStartIdx);

const newTermsBlock = `{/* Terms and Conditions */}
                      <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAD9B8] mt-6 text-left shadow-sm">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              id="terms-checkbox"
                              checked={termsAccepted}
                              onChange={(e) => setTermsAccepted(e.target.checked)}
                              className="w-5 h-5 text-[#D99427] bg-white border-[#D99427] rounded focus:ring-[#D99427] cursor-pointer accent-[#D99427]"
                            />
                          </div>
                          <div className="text-xs text-[#6E5336] w-full">
                            <label htmlFor="terms-checkbox" className="font-bold text-[#2D1F0E] text-sm cursor-pointer block">I agree to the Safed Sheri 2026 Terms & Conditions</label>
                            <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-[#D99427] font-bold mt-1 hover:underline outline-none">
                              {showTerms ? 'Hide Details' : 'Read More'}
                            </button>
                            
                            {showTerms && (
                              <ul className="list-disc pl-4 mt-3 space-y-2 opacity-90 leading-snug animate-fade-in">
                                <li><strong>MANDATORY 75% WHITE RULE:</strong> Entry is strictly conditional on adherence. You will be denied entry without refund if this is violated.</li>
                                <li><strong>NO REFUNDS:</strong> Passes are strictly non-refundable and non-transferable under any circumstances.</li>
                                <li><strong>RIGHT OF ADMISSION:</strong> Management reserves the right to refuse admission or remove anyone failing to comply with rules or causing a disturbance.</li>
                                <li><strong>VALID ID:</strong> Original Government ID matching the pass name is mandatory at the gate. No digital copies accepted.</li>
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      `;

code = code.replace(blockToRemove, newTermsBlock);

fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
console.log('Force replaced terms block');
