const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/security/page.tsx', 'utf8');

// 1. Remove static import
code = code.replace(
  /import \{ Html5QrcodeScanner \} from 'html5-qrcode';\r?\n/,
  ''
);

// 2. Change useEffect to dynamically import and initialize
code = code.replace(
  /useEffect\(\(\) => \{\s*if \(isAuthenticated !== true\) return;\s*const scanner = new Html5QrcodeScanner\(\s*'qr-reader',\s*\{ fps: 10, qrbox: \{ width: 250, height: 250 \} \},\s*false\s*\);\s*const onScanSuccess = \(decodedText: string\) => \{\s*if \(!scanningRef\.current\) \{\s*processScan\(decodedText\);\s*\}\s*\};\s*scanner\.render\(onScanSuccess, \(err\) => \{\s*\/\/ ignore\s*\}\);\s*return \(\) => \{\s*scanner\.clear\(\)\.catch\(console\.error\);\s*\};\s*\}, \[isAuthenticated\]\);/g,
  `useEffect(() => {
    if (isAuthenticated !== true) return;

    let scanner: any;

    const initScanner = async () => {
      // Dynamic import to prevent Next.js SSR window errors
      const { Html5QrcodeScanner } = await import('html5-qrcode');

      scanner = new Html5QrcodeScanner(
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
        // ignore errors like 'QR code not found'
      });
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isAuthenticated]);`
);

fs.writeFileSync('d:/safedsheri/apps/admin/app/security/page.tsx', code);
console.log('Scanner SSR fixed.');
