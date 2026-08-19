const fs = require('fs');

let code = fs.readFileSync('d:/safedsheri/apps/admin/app/security/page.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  /import \{ CheckCircle2, XCircle, RefreshCw, Camera, Keyboard, Lock, Shield \} from 'lucide-react';/,
  `import { CheckCircle2, XCircle, RefreshCw, Camera, Keyboard, Lock, Shield } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRef } from 'react';`
);

// 2. Add useRef for scanning
code = code.replace(
  /const \[scanning, setScanning\] = useState\(false\);/,
  `const [scanning, setScanning] = useState(false);
  const scanningRef = useRef(false);
  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);`
);

// 3. Add Scanner initialization useEffect
code = code.replace(
  /async function processScan\(token: string\) \{/,
  `useEffect(() => {
    if (isAuthenticated !== true) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = (decodedText: string) => {
      if (!scanningRef.current) {
        processScan(decodedText);
      }
    };

    scanner.render(onScanSuccess, (err) => {
      // ignore
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isAuthenticated]);

  async function processScan(token: string) {`
);

// 4. Replace camera simulator with the real div
code = code.replace(
  /<div className=\"h-56 rounded-2xl bg-\[\#FFFDF9\] border-2 border-dashed border-\[\#EAD9B8\] flex flex-col items-center justify-center space-y-3 relative overflow-hidden\">[\s\S]*?<\/div>/,
  `<div id="qr-reader" className="w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#EAD9B8] bg-[#FFFDF9]"></div>`
);

fs.writeFileSync('d:/safedsheri/apps/admin/app/security/page.tsx', code);
console.log('Scanner fixed.');
