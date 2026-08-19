const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

const oldStr = `onClick={() => {
                      setActivePaymentLink(null);
                      setIsWalletOpen(true);
                    }}`;

const newStr = `onClick={() => {
                      setActivePaymentLink(null);
                      setIsWalletOpen(true);
                      
                      const cleanDigits = walletPhone.replace(/\\D/g, '');
                      if (cleanDigits) {
                        setWalletLoading(true);
                        fetch(\`\${API_BASE}/credentials/my-pass?query=\${encodeURIComponent(cleanDigits)}\`)
                          .then(res => res.json())
                          .then(json => {
                            if (json.success && json.data) setWalletPasses(json.data);
                          })
                          .catch(err => console.error(err))
                          .finally(() => setWalletLoading(false));
                      }
                    }}`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
console.log('Wallet refresh patched');
