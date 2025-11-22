import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding sample expense data...');

  // Get the main location
  const mainLocation = await prisma.location.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!mainLocation) {
    console.log('No locations found');
    return;
  }

  // Get an admin user for the expense
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
  });

  if (!adminUser) {
    console.log('No admin user found');
    return;
  }

  console.log(`Adding expenses for: ${mainLocation.name}`);

  // Create sample expenses for the last 30 days
  const expenses = [
    {
      category: 'RENT',
      description: 'Monthly store rent',
      amount: 2500,
      status: 'PAID',
      daysAgo: 5,
    },
    {
      category: 'UTILITIES',
      description: 'Electricity bill',
      amount: 350,
      status: 'PAID',
      daysAgo: 10,
    },
    {
      category: 'UTILITIES',
      description: 'Water bill',
      amount: 85,
      status: 'PAID',
      daysAgo: 10,
    },
    {
      category: 'SUPPLIES',
      description: 'Office supplies',
      amount: 125,
      status: 'APPROVED',
      daysAgo: 3,
    },
    {
      category: 'MAINTENANCE',
      description: 'POS terminal repair',
      amount: 200,
      status: 'PAID',
      daysAgo: 15,
    },
    {
      category: 'MARKETING',
      description: 'Social media advertising',
      amount: 300,
      status: 'APPROVED',
      daysAgo: 7,
    },
    {
      category: 'PAYROLL',
      description: 'Weekly payroll',
      amount: 3500,
      status: 'PAID',
      daysAgo: 1,
    },
    {
      category: 'INSURANCE',
      description: 'Business insurance premium',
      amount: 450,
      status: 'PAID',
      daysAgo: 20,
    },
  ];

  let expenseNum = 1000;
  for (const expense of expenses) {
    const expenseDate = new Date();
    expenseDate.setDate(expenseDate.getDate() - expense.daysAgo);

    await prisma.expense.create({
      data: {
        expenseNumber: `EXP-${expenseNum++}`,
        locationId: mainLocation.id,
        userId: adminUser.id,
        category: expense.category as any,
        description: expense.description,
        amount: expense.amount,
        expenseDate: expenseDate,
        status: expense.status as any,
      },
    });

    console.log(`  Created: ${expense.description} - $${expense.amount}`);
  }

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  console.log(`\nTotal expenses created: $${totalExpenses}`);

  // Show approved/paid total (what will show in dashboard)
  const approvedPaid = expenses
    .filter(e => ['APPROVED', 'PAID'].includes(e.status))
    .reduce((sum, e) => sum + e.amount, 0);
  console.log(`Approved/Paid expenses (shown in dashboard): $${approvedPaid}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
