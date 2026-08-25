const dob1 = new Date('2015-08-18T00:00:00.000Z');
const dob2 = new Date('2025-08-13T00:00:00.000Z');

function calcAge(dob) {
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const age1 = calcAge(dob1);
const age2 = calcAge(dob2);
console.log('Age 1:', age1, 'Cost:', (age1 >= 10 && age1 <= 15) ? 1200 : 0);
console.log('Age 2:', age2, 'Cost:', (age2 >= 10 && age2 <= 15) ? 1200 : 0);

const arr = [ {dob: dob1}, {dob: dob2} ];
const recalculatedAmount = arr.reduce((sum, ra) => {
  if (ra.dob) {
    const diffMs = Date.now() - ra.dob.getTime();
    const ageDate = new Date(diffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age >= 10 && age <= 15) return sum + 1200;
    return sum;
  }
  return sum;
}, 0);

console.log('recalculatedAmount:', recalculatedAmount);
