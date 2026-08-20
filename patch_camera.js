const fs = require('fs');
const file = 'd:/safedsheri/apps/admin/app/security/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
content = content.replace(
  "  const [scanning, setScanning] = useState(false);",
  "  const [scanning, setScanning] = useState(false);\n  const [cameraError, setCameraError] = useState<string | null>(null);\n  const [html5Scanner, setHtml5Scanner] = useState<any>(null);"
);

// 2. Set html5Scanner in initScanner
content = content.replace(
  "scanner = new Html5Qrcode('qr-reader');",
  "scanner = new Html5Qrcode('qr-reader');\n        if (isMounted) setHtml5Scanner(scanner);"
);

// 3. Add error handling for scanner.start
content = content.replace(
  /        try \{\n          if \(isMounted\) \{\n            await scanner\.start\(\{ facingMode: 'environment' \}, config, onScanSuccess, \(\) => \{\}\);\n          \}\n        \} catch \(err\) \{[\s\S]*?\} catch \(err\) \{\n        console\.error\('Failed to initialize scanner library:', err\);\n      \}/,
`        try {
          if (isMounted) {
            await scanner.start({ facingMode: 'environment' }, config, onScanSuccess, () => {});
          }
        } catch (err) {
          console.warn('Environment camera failed, falling back to user camera', err);
          if (isMounted) {
            try {
              await scanner.start({ facingMode: 'user' }, config, onScanSuccess, () => {});
            } catch (fallbackErr) {
              console.error('All camera attempts failed:', fallbackErr);
              if (isMounted) {
                if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                  setCameraError('Camera access requires HTTPS. Unencrypted HTTP blocks cameras.');
                } else {
                  setCameraError('Camera access denied or no camera found.');
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to initialize scanner library:', err);
        if (isMounted) {
          if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            setCameraError('Camera access requires a secure HTTPS connection.');
          } else {
            setCameraError(err?.message || 'Failed to initialize scanner.');
          }
        }
      }`
);

// 4. Add handleFileUpload
content = content.replace(
  "  function handleManualSubmit(e: React.FormEvent) {",
  `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && html5Scanner) {
      try {
        const decodedText = await html5Scanner.scanFile(e.target.files[0], true);
        processScan(decodedText);
      } catch (err) {
        console.error("Failed to decode QR from image", err);
        alert("Could not find a valid QR code in this image.");
      }
    }
  };

  function handleManualSubmit(e: React.FormEvent) {`
);

// 5. Update UI
content = content.replace(
  '<div id="qr-reader" className="w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#EAD9B8] bg-[#FFFDF9]"></div>',
`<div className="relative w-full min-h-[250px] overflow-hidden rounded-2xl border-2 border-dashed border-[#EAD9B8] bg-[#FFFDF9] flex items-center justify-center">
          <div id="qr-reader" className="w-full"></div>
          
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#FFFDF9] z-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-red-900 leading-tight">{cameraError}</p>
              
              <label className="mt-4 px-6 py-3 bg-gradient-to-r from-[#F6C85F] to-[#E5A93C] text-[#2D1F0E] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md hover:opacity-90">
                Upload QR Image Instead
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>`
);

fs.writeFileSync(file, content);
