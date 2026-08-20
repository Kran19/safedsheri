const fs = require('fs');
const file = 'd:/safedsheri/apps/admin/app/security/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldProcessScan = `  async function processScan(token: string) {
    if (!token || scanning) return;
    setScanning(true);

    const res = await apiRequest('/entries/scan', {
      method: 'POST',
      body: JSON.stringify({ token: token.trim() }),
    });

    setScanning(false);

    if (res.success && res.data) {
      setScanResult(res.data);

      setRecentScans((prev) => [
        {
          token,
          status: res.data.status,
          reason: res.data.reason,
          name: res.data.attendeeName,
          passType: res.data.passType,
          passCode: res.data.passCode,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 5),
      ]);

      setTimeout(() => {
        setScanResult({ status: null });
      }, 2500);
    } else {
      if (res.error?.code === 'UNAUTHORIZED') {
        setIsAuthenticated(false);
        return;
      }
      setScanResult({
        status: 'NOT_VALID',
        reason: 'INVALID_TOKEN',
      });
      setTimeout(() => {
        setScanResult({ status: null });
      }, 2500);
    }
  }`;

const newProcessScan = `  async function processScan(token: string) {
    if (!token || scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);

    const res = await apiRequest('/entries/scan', {
      method: 'POST',
      body: JSON.stringify({ token: token.trim() }),
    });

    if (res.success && res.data) {
      setScanResult(res.data);

      setRecentScans((prev) => [
        {
          token,
          status: res.data.status,
          reason: res.data.reason,
          name: res.data.attendeeName,
          passType: res.data.passType,
          passCode: res.data.passCode,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 5),
      ]);

      setTimeout(() => {
        setScanResult({ status: null });
        scanningRef.current = false;
        setScanning(false);
      }, 3000);
    } else {
      if (res.error?.code === 'UNAUTHORIZED') {
        setIsAuthenticated(false);
        return;
      }
      setScanResult({
        status: 'NOT_VALID',
        reason: res.error?.message || 'INVALID_TOKEN',
      });
      setTimeout(() => {
        setScanResult({ status: null });
        scanningRef.current = false;
        setScanning(false);
      }, 3000);
    }
  }`;

if (content.includes(oldProcessScan)) {
  fs.writeFileSync(file, content.replace(oldProcessScan, newProcessScan));
} else {
  console.log("Could not find processScan exactly to replace");
}
