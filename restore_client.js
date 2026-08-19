const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

// 1. Fix horizontal overflow on main wrapper
code = code.replace(
  /<main className="min-h-screen bg-\[\#FFFCF7\] text-\[\#2D1F0E\] font-sans selection:bg-\[\#D99427\] selection:text-white relative scroll-smooth">/,
  `<main className="min-h-screen bg-[#FFFCF7] text-[#2D1F0E] font-sans selection:bg-[#D99427] selection:text-white relative scroll-smooth overflow-x-hidden">`
);

// 2. Add video background and glass morphism to isBookingOpen modal
code = code.replace(
  /<div className="fixed inset-0 z-50 overflow-y-auto flex justify-center items-center py-6 px-3 sm:px-6 animate-fade-in">\s*<div className="fixed inset-0 bg-black\/40 backdrop-blur-sm z-0" \/>\s*<div className="bg-white border-2 border-\[\#EAD9B8\] rounded-\[2\.5rem\] w-full max-w-3xl shadow-2xl relative z-10 text-\[\#2D1F0E\] p-6 sm:p-10 my-auto">/,
  `<div className="fixed inset-0 z-50 overflow-y-auto flex justify-center items-center py-6 px-3 sm:px-6 animate-fade-in">
            <video autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover z-0">
              <source src="/safedsheri/formvideo.mp4" type="video/mp4" />
            </video>
            <div className="fixed inset-0 bg-black/40 z-0" />
            <div className="bg-white/20 border border-white/30 rounded-[2.5rem] w-full max-w-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative z-10 text-white p-6 sm:p-10 my-auto">`
);

// Update colors inside the booking modal to work with dark video background
code = code.replace(
  /<h3 className="text-xl sm:text-2xl font-serif font-bold text-\[\#2D1F0E\]">/g,
  `<h3 className="text-xl sm:text-2xl font-serif font-bold text-white">`
);
code = code.replace(
  /className="text-sm font-bold text-\[\#6E5336\] mb-2"/g,
  `className="text-sm font-bold text-white/90 mb-2"`
);
code = code.replace(
  /className="px-3 py-1\.5 rounded-full bg-\[\#FAF6EE\] border border-\[\#EAD9B8\] text-\[11px\] font-bold text-\[\#8C6019\] flex items-center space-x-1 hover:bg-\[\#FFF5DC\] transition"/g,
  `className="px-3 py-1.5 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/30 text-[11px] font-bold text-white/80 flex items-center space-x-1 transition"`
);
code = code.replace(
  /className="absolute top-6 right-6 sm:top-8 sm:right-8 w-10 h-10 rounded-full bg-\[\#FAF6EE\] text-\[\#A3927B\] hover:text-\[\#2D1F0E\] hover:bg-\[\#F0E5D1\] flex items-center justify-center border border-\[\#EAD9B8\] transition"/g,
  `className="absolute top-6 right-6 sm:top-8 sm:right-8 w-10 h-10 rounded-full bg-white/20 text-white/80 hover:text-white flex items-center justify-center border border-white/30 transition"`
);

// 3. Terms and conditions state and toggle
code = code.replace(
  /const \[paymentError, setPaymentError\] = useState<string \| null>\(null\);/,
  `const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);`
);

code = code.replace(
  /<div className="bg-\[\#FAF6EE\] border border-\[\#EAD9B8\] rounded-2xl p-4 sm:p-6 mb-8">[\s\S]*?<\/div>/,
  `<div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 mb-8 text-white">
                <div className="flex items-start space-x-3 mb-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/30 text-[#D99427] focus:ring-[#D99427] bg-white/10"
                  />
                  <div>
                    <label htmlFor="terms" className="text-sm font-bold text-white block cursor-pointer">
                      I accept the Safed Sheri 2026 Terms & Conditions
                    </label>
                    <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-[11px] font-bold text-[#F6C85F] uppercase hover:underline mt-1">
                      {showTerms ? 'Hide Details' : 'Read More'}
                    </button>
                  </div>
                </div>
                
                {showTerms && (
                  <ul className="list-disc pl-10 mt-3 space-y-2 text-[11px] text-white/80 leading-relaxed">
                    <li><strong>MANDATORY 75% WHITE RULE:</strong> Entry is strictly conditional on adherence. You will be denied entry without refund if this is violated.</li>
                    <li><strong>NO REFUNDS:</strong> Passes are strictly non-refundable and non-transferable under any circumstances.</li>
                    <li><strong>RIGHT OF ADMISSION:</strong> Management reserves the right to refuse admission or remove anyone failing to comply with rules or causing a disturbance.</li>
                    <li><strong>VALID ID:</strong> Original Government ID matching the pass name is mandatory at the gate. No digital copies accepted.</li>
                  </ul>
                )}
              </div>`
);

// 4. Polling for Wallet Search
code = code.replace(
  /const executeWalletSearch = async \(queryToSearch: string\) => \{/,
  `useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWalletOpen && walletPhone) {
      interval = setInterval(() => {
        executeWalletSearch(walletPhone, true);
      }, 5000); // 5 second polling
    }
    return () => clearInterval(interval);
  }, [isWalletOpen, walletPhone]);
  
  const executeWalletSearch = async (queryToSearch: string, silent = false) => {`
);
code = code.replace(
  /setWalletLoading\(true\);\s*setWalletSearched\(true\);\s*setWalletPasses\(\[\]\);/g,
  'if (!silent) { setWalletLoading(true); setWalletSearched(true); setWalletPasses([]); }'
);
code = code.replace(
  /} finally \{\s*setWalletLoading\(false\);\s*\}/g,
  '} finally { if (!silent) setWalletLoading(false); }'
);

fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
console.log('Restored LandingPageClient.tsx successfully');
