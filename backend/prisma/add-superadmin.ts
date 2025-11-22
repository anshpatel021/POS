import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Adding Super Admin user...');

  // Check if super admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: 'superadmin@pos.com' },
  });

  if (existing) {
    console.log('⚠️ Super Admin already exists:', existing.email);
    return;
  }

  const hashedPassword = await bcrypt.hash('superadmin123', 10);

  await prisma.user.create({
    data: {
      email: 'superadmin@pos.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      locationId: null,
    },
  });

  console.log('✅ Super Admin created successfully!');
  console.log('');
  console.log('📧 Email: superadmin@pos.com');
  console.log('🔑 Password: superadmin123');
  console.log('');
  console.log('⚠️  Please change this password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
