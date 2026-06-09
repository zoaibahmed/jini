import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring test accounts exist...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const accounts = [
    { email: 'driver@test.com', name: 'Test Driver', role: UserRole.DRIVER, phone: '+15550001111' },
    { email: 'support@test.com', name: 'Test Support', role: UserRole.SUPPORT, phone: '+15550002222' },
    { email: 'admin@test.com', name: 'Test Admin', role: UserRole.ADMIN, phone: '+15550003333' },
    { email: 'superadmin@test.com', name: 'Test Super Admin', role: UserRole.SUPERADMIN, phone: '+15550004444' }
  ];

  for (const acc of accounts) {
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        password: passwordHash,
        role: acc.role,
        isVerified: true
      },
      create: {
        email: acc.email,
        name: acc.name,
        password: passwordHash,
        phone: acc.phone,
        role: acc.role,
        isVerified: true,
      }
    });

    if (acc.role === UserRole.DRIVER) {
      await prisma.driverProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          driverType: 'Uber',
          languages: ['English'],
          documentsUploaded: true,
        }
      });
    }

    console.log(`Ensured account: ${acc.email} / password123 (Role: ${acc.role})`);
  }

  console.log('Test accounts are ready!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
