import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing sales with null locationId...');

  // Get the first (main) location
  const mainLocation = await prisma.location.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!mainLocation) {
    console.log('No locations found in database');
    return;
  }

  console.log(`Main location: ${mainLocation.name} (${mainLocation.id})`);

  // Count sales with null locationId
  const nullSalesCount = await prisma.sale.count({
    where: { locationId: null },
  });

  console.log(`Found ${nullSalesCount} sales with null locationId`);

  if (nullSalesCount === 0) {
    console.log('No sales to fix!');
    return;
  }

  // Update all sales with null locationId
  const result = await prisma.sale.updateMany({
    where: { locationId: null },
    data: { locationId: mainLocation.id },
  });

  console.log(`Updated ${result.count} sales to use location: ${mainLocation.name}`);

  // Verify the fix
  const remainingNull = await prisma.sale.count({
    where: { locationId: null },
  });

  console.log(`Remaining sales with null locationId: ${remainingNull}`);

  // Show updated totals
  const locationStats = await prisma.sale.aggregate({
    where: { locationId: mainLocation.id },
    _sum: { total: true },
    _count: true,
  });

  console.log(`\nMain Store Stats:`);
  console.log(`  Total Sales: ${locationStats._count}`);
  console.log(`  Total Revenue: $${locationStats._sum.total?.toFixed(2) || 0}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
