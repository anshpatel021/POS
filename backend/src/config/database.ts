import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle cleanup on shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
