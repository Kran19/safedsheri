const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

// 1. Add showTerms state
code = code.replace(
  'const [termsAccepted, setTermsAccepted] = useState(false);',
  'const [termsAccepted, setTermsAccepted] = useState(false);\n  const [showTerms, setShowTerms] = useState(false);'
);

// 2. Remove terms block from QUANTITY step and replace button
const oldTermsBlock = `                      {/* Terms and Conditions */}
                      <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAD9B8] mt-6 text-left shadow-sm">
                        <label className="flex items-start space-x-4 cursor-pointer">
                          <div className="flex-shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              checked={termsAccepted}
                              onChange={(e) => setTermsAccepted(e.target.checked)}
                              className="w-5 h-5 text-[#D99427] bg-white border-[#D99427] rounded focus:ring-[#D99427] cursor-pointer accent-[#D99427]"
                            />
                          </div>
                          <div className="text-xs text-[#6E5336] space-y-2">
                            <p className="font-bold text-[#2D1F0E] text-sm mb-2">I agree to the Safed Sheri 2026 Terms & Conditions:</p>
                            <ul className="list-disc pl-4 space-y-1.5 opacity-80">
                              <li><strong>Compulsory Dress Code:</strong> 75% White Rule: At least 75% of your visible attire must be pure white. Entry is strictly conditional on adherence.</li>
                              <li>Placeholder 2: [Client will provide text]</li>
                              <li>Placeholder 3: [Client will provide text]</li>
                              <li>Placeholder 4: [Client will provide text]</li>
                            </ul>
                          </div>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={!termsAccepted}
                        className="w-full py-4 mt-6 rounded-2xl bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-[#D99427]/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                      >
                        <span>Continue to Guest Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>`;

const newQuantityButton = `                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full py-4 mt-6 rounded-2xl bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-[#D99427]/20 flex items-center justify-center space-x-2 transition"
                      >
                        <span>Continue to Guest Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>`;

code = code.replace(oldTermsBlock, newQuantityButton);

// 3. Add Terms block to ATTENDEE step and update its Next button
const oldAttendeeNav = `                    {/* Navigation Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-6 py-3 rounded-full bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{currentAttendeeIndex === 0 && selectedPass === 'SINGLE' ? 'Pass Count' : 'Previous'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-[#D99427]/20 flex items-center space-x-2 transition"
                      >`;

const newAttendeeNav = `                    {currentAttendeeIndex === 0 && (
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
                    )}

                    {/* Navigation Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-6 py-3 rounded-full bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#EAD9B8] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{currentAttendeeIndex === 0 && selectedPass === 'SINGLE' ? 'Pass Count' : 'Previous'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={currentAttendeeIndex === 0 && !termsAccepted}
                        className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-[#D99427]/20 flex items-center space-x-2 transition disabled:opacity-50"
                      >`;

code = code.replace(oldAttendeeNav, newAttendeeNav);

fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
console.log('Terms moved successfully');
