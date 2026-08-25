const fs = require('fs');

// 1. registrations.service.ts
const regFile = 'd:/safedsheri/apps/api/src/registrations/registrations.service.ts';
let regContent = fs.readFileSync(regFile, 'utf8');

const regRule2Old = `// RULE 2: Couple Pass requires exactly 2 attendees
    if (data.passType === PassType.COUPLE) {
      if (data.attendees.length !== 2) {
        throw new BadRequestException('Couple Pass requires exactly 2 attendee records');
      }
    }`;

const regRule2New = `// RULE 2: Couple Pass requires exactly 2 attendees (Strictly 1 Male, 1 Female)
    if (data.passType === PassType.COUPLE) {
      if (data.attendees.length !== 2) {
        throw new BadRequestException('Couple Pass requires exactly 2 attendee records');
      }
      const maleCount = data.attendees.filter(a => a.gender === 'MALE').length;
      const femaleCount = data.attendees.filter(a => a.gender === 'FEMALE').length;
      if (maleCount !== 1 || femaleCount !== 1) {
        throw new BadRequestException('Couple Pass strictly requires exactly 1 Male and 1 Female attendee.');
      }
    }`;

regContent = regContent.replace(regRule2Old, regRule2New);
fs.writeFileSync(regFile, regContent);

// 2. payments.service.ts
const payFile = 'd:/safedsheri/apps/api/src/payments/payments.service.ts';
let payContent = fs.readFileSync(payFile, 'utf8');

const payOld = `// Removed Single Pass Female rule to allow any gender to book`;

const payNew = `// Removed Single Pass Female rule to allow any gender to book

    // Strict validation for Couple Pass
    if (dto.passType === 'COUPLE') {
      if (dto.attendees.length !== 2) {
        throw new BadRequestException('Couple Pass requires exactly 2 attendee records');
      }
      const maleCount = dto.attendees.filter(a => a.gender === 'MALE').length;
      const femaleCount = dto.attendees.filter(a => a.gender === 'FEMALE').length;
      if (maleCount !== 1 || femaleCount !== 1) {
        throw new BadRequestException('Couple Pass strictly requires exactly 1 Male and 1 Female attendee.');
      }
    }`;

payContent = payContent.replace(payOld, payNew);
fs.writeFileSync(payFile, payContent);

console.log('Couple pass validation successfully enforced.');
