const fs = require('fs');

const file = 'd:/safedsheri/apps/admin/app/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add icons to lucide-react import
if (content.includes("from 'lucide-react';")) {
  if (!content.includes('Eye,')) content = content.replace("from 'lucide-react';", "Eye, EyeOff, from 'lucide-react';");
}

// 2. Add state variables for credentials
const stateCode = `  const [credentialsForm, setCredentialsForm] = useState({ newUsername: '', newPassword: '', currentPassword: '' });
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [credentialsSuccess, setCredentialsSuccess] = useState('');

  async function handleUpdateCredentials(e: React.FormEvent) {
    e.preventDefault();
    setCredentialsError('');
    setCredentialsSuccess('');
    if (!credentialsForm.currentPassword) {
      setCredentialsError('Current password is required to save changes.');
      return;
    }
    setCredentialsLoading(true);
    const res = await apiRequest('/auth/update-credentials', credentialsForm, 'PATCH');
    setCredentialsLoading(false);
    if (res.success) {
      setCredentialsSuccess('Credentials updated successfully. You will be logged out in 3 seconds to re-authenticate.');
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.reload();
      }, 3000);
    } else {
      setCredentialsError(res.error?.message || 'Failed to update credentials.');
    }
  }
`;

if (!content.includes('const [credentialsForm')) {
  content = content.replace(
    `const [pricingSettings, setPricingSettings] = useState<any>({`,
    `${stateCode}\n  const [pricingSettings, setPricingSettings] = useState<any>({`
  );
}

// 3. Add Settings tab button
const tabCode = `{ id: 'settings', label: 'Account Settings', icon: Settings },`;
if (!content.includes("id: 'settings'")) {
  content = content.replace(
    `{ id: 'trash', label: 'Trash', icon: Trash2 },`,
    `{ id: 'settings', label: 'Account Settings', icon: Settings },\n          { id: 'trash', label: 'Trash', icon: Trash2 },`
  );
}

// 4. Add UI to the settings block
const settingsUI = `
          {/* ACCOUNT SETTINGS - CREDENTIALS */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#EAD9B8]">
            <h2 className="text-2xl font-serif text-[#2D1F0E] mb-2 flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#8C6019]" />
              Admin Credentials
            </h2>
            <p className="text-sm text-[#6E5336] mb-6">
              Change your login email ID (username) or password. You will be asked to re-login if changes are successful.
            </p>

            <form onSubmit={handleUpdateCredentials} className="space-y-6 max-w-lg">
              {credentialsSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  {credentialsSuccess}
                </div>
              )}
              {credentialsError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {credentialsError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#6E5336] mb-1.5 uppercase tracking-wider">New Email / Username</label>
                <input
                  type="text"
                  value={credentialsForm.newUsername}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, newUsername: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="w-full bg-[#F8F5EE] border-2 border-[#EAD9B8] rounded-xl px-4 py-3 text-[#2D1F0E] focus:outline-none focus:border-[#8C6019] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E5336] mb-1.5 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={credentialsForm.newPassword}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, newPassword: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="w-full bg-[#F8F5EE] border-2 border-[#EAD9B8] rounded-xl px-4 py-3 text-[#2D1F0E] focus:outline-none focus:border-[#8C6019] transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-[#EAD9B8]">
                <label className="block text-xs font-bold text-[#D99427] mb-1.5 uppercase tracking-wider">Current Password (Required)</label>
                <input
                  type="password"
                  required
                  value={credentialsForm.currentPassword}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, currentPassword: e.target.value })}
                  placeholder="Enter current password to verify"
                  className="w-full bg-[#F8F5EE] border-2 border-[#EAD9B8] rounded-xl px-4 py-3 text-[#2D1F0E] focus:outline-none focus:border-[#D99427] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={credentialsLoading}
                className="w-full py-4 rounded-xl bg-[#2D1F0E] text-white font-bold tracking-widest uppercase hover:bg-[#1A1208] transition-colors shadow-lg disabled:opacity-50"
              >
                {credentialsLoading ? 'Saving...' : 'Update Credentials'}
              </button>
            </form>
          </div>
`;

if (!content.includes('ACCOUNT SETTINGS - CREDENTIALS')) {
  content = content.replace(
    `<div className="space-y-6 animate-fade-in">`,
    `<div className="space-y-6 animate-fade-in">${settingsUI}`
  );
}

fs.writeFileSync(file, content);
console.log('Patch complete.');
