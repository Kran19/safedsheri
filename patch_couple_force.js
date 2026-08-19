const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

const navBarMarker = "{/* Navigation Bar */}";
// Find the Navigation Bar that is right after the "Automatically use this phone" label
const autoPhoneMarker = "Automatically use this phone";
const autoPhoneIdx = code.indexOf(autoPhoneMarker);

if (autoPhoneIdx === -1) {
    console.error("Could not find autoPhoneMarker");
    process.exit(1);
}

const navBarIdx = code.indexOf(navBarMarker, autoPhoneIdx);

if (navBarIdx === -1) {
    console.error("Could not find navBarIdx");
    process.exit(1);
}

// Find the handleNextStep button in this nav bar to add the disabled prop
const nextStepIdx = code.indexOf('onClick={handleNextStep}', navBarIdx);
const classNameIdx = code.indexOf('className=', nextStepIdx);

// Now, we inject the terms block right before navBarMarker
const termsBlockToInject = `                    {selectedPass === 'COUPLE' && currentAttendeeIndex === 0 && (
                      <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#EAD9B8] mt-6 text-left shadow-sm animate-fade-in mb-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              id="terms-checkbox-couple"
                              checked={termsAccepted}
                              onChange={(e) => setTermsAccepted(e.target.checked)}
                              className="w-5 h-5 text-[#D99427] bg-white border-[#D99427] rounded focus:ring-[#D99427] cursor-pointer accent-[#D99427]"
                            />
                          </div>
                          <div className="text-xs text-[#6E5336] w-full">
                            <label htmlFor="terms-checkbox-couple" className="font-bold text-[#2D1F0E] text-sm cursor-pointer block">I agree to the Safed Sheri 2026 Terms & Conditions</label>
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

                    `;

const codeBeforeNav = code.substring(0, navBarIdx);
const codeAfterNav = code.substring(navBarIdx);

code = codeBeforeNav + termsBlockToInject + codeAfterNav;

// Now update the button disabled state
// We need to find the specific button string
const oldBtnStr = `                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-[#D99427]/20 flex items-center space-x-2 transition"
                        >`;

const newBtnStr = `                        <button
                          type="button"
                          onClick={handleNextStep}
                          disabled={selectedPass === 'COUPLE' && currentAttendeeIndex === 0 && !termsAccepted}
                          className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F6C85F] via-[#E5A93C] to-[#D99427] text-[#2D1F0E] font-bold text-xs tracking-widest uppercase hover:opacity-95 shadow-md shadow-[#D99427]/20 flex items-center space-x-2 transition disabled:opacity-50"
                        >`;

code = code.replace(oldBtnStr, newBtnStr);

fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
console.log('Force injected COUPLE terms');
