const fs = require('fs');

// 1. LandingPageClient.tsx
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

// A) Fix horizontal scroll
code = code.replace(
  /<main className="min-h-screen bg-\[\#FFFCF7\] text-\[\#2D1F0E\] font-sans selection:bg-\[\#D99427\] selection:text-white relative scroll-smooth">/,
  `<main className="min-h-screen bg-[#FFFCF7] text-[#2D1F0E] font-sans selection:bg-[#D99427] selection:text-white relative scroll-smooth overflow-x-hidden">`
);

// B) Modify executeWalletSearch to accept silent parameter
code = code.replace(
  /const executeWalletSearch = async \(queryToSearch: string\) => \{/g,
  'const executeWalletSearch = async (queryToSearch: string, silent = false) => {'
);
code = code.replace(
  /setWalletLoading\(true\);\s*setWalletSearched\(true\);\s*setWalletPasses\(\[\]\);/g,
  'if (!silent) { setWalletLoading(true); setWalletSearched(true); setWalletPasses([]); }'
);
code = code.replace(
  /} finally \{\s*setWalletLoading\(false\);\s*\}/g,
  '} finally { if (!silent) setWalletLoading(false); }'
);

// C) Add useEffect for polling if wallet is open
code = code.replace(
  /const executeWalletSearch = async \(queryToSearch: string, silent = false\) => \{/,
  `useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isWalletOpen && walletPhone) {
      interval = setInterval(() => {
        executeWalletSearch(walletPhone, true);
      }, 5000); // 5 second polling
    }
    return () => clearInterval(interval);
  }, [isWalletOpen, walletPhone]);
  
  const executeWalletSearch = async (queryToSearch: string, silent = false) => {`
);

fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
console.log('Restored the 5s polling and fixed the gap.');
