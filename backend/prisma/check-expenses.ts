import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany({
    select: {
      expenseNumber: true,
      description: true,
      amount: true,
      status: true,
      expenseDate: true,
    },
    orderBy: { expenseDate: 'desc' }
  });

  console.log('All expenses in database:');
  expenses.forEach(e => {
    console.log(`  ${e.expenseNumber}: ${e.description} - $${e.amount} (${e.status})`);
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  console.log(`\nTotal: $${total}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
