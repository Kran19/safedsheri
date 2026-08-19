const fs = require('fs');
let code = fs.readFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', 'utf8');

code = code.replace(
  /\{\/\* Terms and Conditions \*\/\}\r?\n\s*\r?\n\s*\)\}/g,
  `{/* Terms and Conditions */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}`
);

fs.writeFileSync('d:/safedsheri/apps/admin/app/LandingPageClient.tsx', code);
console.log('Fixed brackets');
