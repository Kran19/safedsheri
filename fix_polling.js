const fs = require('fs');

// 1. LandingPageClient.tsx
let clientCode = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

// Modify executeWalletSearch to accept silent parameter
clientCode = clientCode.replace(
  /const executeWalletSearch = async \(queryToSearch: string\) => \{/g,
  'const executeWalletSearch = async (queryToSearch: string, silent = false) => {'
);
clientCode = clientCode.replace(
  /setWalletLoading\(true\);\s*setWalletSearched\(true\);\s*setWalletPasses\(\[\]\);/g,
  'if (!silent) { setWalletLoading(true); setWalletSearched(true); setWalletPasses([]); }'
);
clientCode = clientCode.replace(
  /} finally \{\s*setWalletLoading\(false\);\s*\}/g,
  '} finally { if (!silent) setWalletLoading(false); }'
);

// Add useEffect for polling if wallet is open
clientCode = clientCode.replace(
  /const executeWalletSearch = async \(queryToSearch: string, silent = false\) => \{/,
  `useEffect(() => {
    let interval;
    if (isWalletOpen && walletPhone) {
      interval = setInterval(() => {
        executeWalletSearch(walletPhone, true);
      }, 5000); // 5 second polling
    }
    return () => clearInterval(interval);
  }, [isWalletOpen, walletPhone]);
  
  const executeWalletSearch = async (queryToSearch: string, silent = false) => {`
);
fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', clientCode);

// 2. Admin Page
let adminCode = fs.readFileSync('d:/safedsheri/apps/admin/app/admin/page.tsx', 'utf8');
adminCode = adminCode.replace(/setInterval\(\(\) => \{[\s\S]*?\}, 15000\);/, `setInterval(() => {
        loadOverviewData(true);
        if (activeTab !== 'overview') {
          loadTabContent(activeTab, true);
        }
      }, 5000);`);
fs.writeFileSync('d:/safedsheri/apps/admin/app/admin/page.tsx', adminCode);

// 3. Cashier Page
let cashierCode = fs.readFileSync('d:/safedsheri/apps/admin/app/cashier/page.tsx', 'utf8');
cashierCode = cashierCode.replace(/setInterval\(\(\) => \{[\s\S]*?\}, 15000\);/, `setInterval(() => {
        loadFinancialData(true);
      }, 5000);`);
fs.writeFileSync('d:/safedsheri/apps/admin/app/cashier/page.tsx', cashierCode);

console.log('Polling fixed to 5s intervals.');
