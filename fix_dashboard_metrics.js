const fs = require('fs');
const file = 'd:/safedsheri/apps/admin/app/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. handleApprove
// look for: `if (res.success) { \n      setMessage(\`Application approved! Payment order activated.\`); \n      setReviewModalOpen(false); \n      setSelectedApp(null); \n      const ref = await apiRequest('/registrations');`
content = content.replace(
  /setMessage\(`Application approved! Payment order activated.`\);\s*setReviewModalOpen\(false\);\s*setSelectedApp\(null\);\s*const ref = await apiRequest\('\/registrations'\);/g,
  `setMessage(\`Application approved! Payment order activated.\`);\n      setReviewModalOpen(false);\n      setSelectedApp(null);\n      loadOverviewData(true);\n      const ref = await apiRequest('/registrations');`
);

// 2. handleReject
// look for: `if (res.success) { \n      setMessage('Application rejected.'); \n      setReviewModalOpen(false); \n      setSelectedApp(null); \n      const ref = await apiRequest('/registrations');`
content = content.replace(
  /setMessage\('Application rejected.'\);\s*setReviewModalOpen\(false\);\s*setSelectedApp\(null\);\s*const ref = await apiRequest\('\/registrations'\);/g,
  `setMessage('Application rejected.');\n      setReviewModalOpen(false);\n      setSelectedApp(null);\n      loadOverviewData(true);\n      const ref = await apiRequest('/registrations');`
);

// 3. handleBatchApprove
// look for: `if (res.success) approvedCount++; \n    } \n    if (approvedCount > 0) { \n      setMessage(\`Successfully approved \${approvedCount} applications.\`); \n      loadTabContent('applications'); \n    }`
content = content.replace(
  /if \(approvedCount > 0\) \{\s*setMessage\(`Successfully approved \$\{approvedCount\} applications.`\);\s*loadTabContent\('applications'\);\s*\}/g,
  `if (approvedCount > 0) {\n      setMessage(\`Successfully approved \${approvedCount} applications.\`);\n      loadOverviewData(true);\n      loadTabContent('applications');\n    }`
);

// 4. handleSoftDelete
// look for: `if (res.success) { \n      setMessage('Application moved to trash.'); \n      setDeleteModalOpen(false); \n      setAppToDelete(null); \n      loadTabContent('applications'); \n    }`
content = content.replace(
  /setMessage\('Application moved to trash.'\);\s*setDeleteModalOpen\(false\);\s*setAppToDelete\(null\);\s*loadTabContent\('applications'\);/g,
  `setMessage('Application moved to trash.');\n      setDeleteModalOpen(false);\n      setAppToDelete(null);\n      loadOverviewData(true);\n      loadTabContent('applications');`
);

// 5. handleHardDelete
// look for: `if (res.success) { \n      setMessage('Application permanently deleted.'); \n      setHardDeleteModalOpen(false); \n      setAppToDelete(null); \n      loadTabContent('trash'); \n    }`
content = content.replace(
  /setMessage\('Application permanently deleted.'\);\s*setHardDeleteModalOpen\(false\);\s*setAppToDelete\(null\);\s*loadTabContent\('trash'\);/g,
  `setMessage('Application permanently deleted.');\n      setHardDeleteModalOpen(false);\n      setAppToDelete(null);\n      loadOverviewData(true);\n      loadTabContent('trash');`
);

// 6. handleUpdateInquiryStatus
// look for: `if (res.success) { \n      loadTabContent(activeTab, true); \n    }`
content = content.replace(
  /const res = await apiRequest\(endpoint, \{\s*method: 'PATCH',\s*body: JSON.stringify\(\{ status \}\),\s*\}\);\s*if \(res.success\) \{\s*loadTabContent\(activeTab, true\);\s*\}/g,
  `const res = await apiRequest(endpoint, {\n      method: 'PATCH',\n      body: JSON.stringify({ status }),\n    });\n\n    if (res.success) {\n      loadOverviewData(true);\n      loadTabContent(activeTab, true);\n    }`
);

fs.writeFileSync(file, content);
console.log('Metrics refresh fixed');
