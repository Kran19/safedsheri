const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Syncing VIP Gazebo list to 14 units safely without clearing data...');
  const levelCounts = { 1: 5, 2: 5, 3: 4 };
  
  for (let l = 1; l <= 3; l++) {
    const price = l === 1 ? 85000 : l === 2 ? 100000 : 125000;
    const count = levelCounts[l];
    for (let g = 1; g <= count; g++) {
      const gazeboNumber = `GZB-L${l}-0${g}`;
      
      const res = await prisma.gazebo.upsert({
        where: { gazeboNumber },
        update: {
          level: l,
          price,
        },
        create: {
          gazeboNumber,
          level: l,
          price,
          status: 'AVAILABLE',
        },
      });
      console.log(`✓ Synchronized Gazebo: ${res.gazeboNumber} (Level ${res.level}, Price ₹${res.price})`);
    }
  }
  console.log('VIP Gazebos synchronization completed successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
