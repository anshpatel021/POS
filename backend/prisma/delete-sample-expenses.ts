import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting sample expenses (EXP-1000 to EXP-1007)...');

  const result = await prisma.expense.deleteMany({
    where: {
      expenseNumber: {
        startsWith: 'EXP-100'
      }
    }
  });

  console.log(`Deleted ${result.count} sample expenses`);

  // Show remaining expenses
  const remaining = await prisma.expense.findMany({
    select: {
      expenseNumber: true,
      description: true,
      amount: true,
      status: true,
    }
  });

  console.log('\nRemaining expenses:');
  remaining.forEach(e => {
    console.log(`  ${e.expenseNumber}: ${e.description} - $${e.amount} (${e.status})`);
  });

  const total = remaining.reduce((sum, e) => sum + e.amount, 0);
  console.log(`\nNew Total: $${total}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
