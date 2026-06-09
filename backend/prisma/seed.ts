import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase A data...');

  // Clear tables that exist
  // // await prisma.notification.deleteMany({}); // Skipped // Skipped as table may not exist yet
  // // await prisma.complianceCheck.deleteMany({}); // Skipped // Skipped as table may not exist yet
  // await prisma.vehicle.deleteMany({}); // Skipped
  // await prisma.driverProfile.deleteMany({}); // Skipped
  // await prisma.userSession.deleteMany({}); // Skipped
  // await prisma.auditLog.deleteMany({}); // Skipped
  // await prisma.user.deleteMany({}); // Skipped

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('ZS3045987', salt);

  // Create users
  const driver = await prisma.user.create({
    data: {
      email: 'driver@jnisolutions.com',
      name: 'Alex Mercer',
      password: passwordHash,
      phone: '+1 (555) 987-6543',
      role: UserRole.DRIVER,
      isVerified: true,
      preferredLanguage: 'English',
      country: 'US',
    },
  });
  const support = await prisma.user.create({
    data: {
      email: 'support@jnisolutions.com',
      name: 'Sarah Connor',
      password: passwordHash,
      phone: '+1 (555) 234-5678',
      role: UserRole.SUPPORT,
      isVerified: true,
    },
  });
  const admin = await prisma.user.create({
    data: {
      email: 'admin@jnisolutions.com',
      name: 'John Connor',
      password: passwordHash,
      phone: '+1 (555) 345-6789',
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@jnisolutions.com',
      name: 'Marcus Wright',
      password: passwordHash,
      phone: '+1 (555) 456-7890',
      role: UserRole.SUPERADMIN,
      isVerified: true,
    },
  });

  // Driver profile
  const driverProfile = await prisma.driverProfile.create({
    data: {
      userId: driver.id,
      driverType: 'Uber',
      languages: ['English', 'Spanish'],
      documentsUploaded: true,
    },
  });

  // Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      make: 'Toyota',
      model: 'Camry Hybrid',
      year: 2022,
      plate: 'T800TLC',
      vin: '1T1Y78HB892JNI001',
      driverId: driver.id,
    },
  });

  // Compliance checks
  await prisma.complianceCheck.createMany({
    data: [
      {
        title: 'TLC Vehicle Inspection',
        description: 'Mandatory TLC DMV physical vehicle safety inspection.',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        driverId: driver.id,
      },
      {
        title: 'Annual TLC Drug Screening',
        description: 'Annual drug test required by TLC.',
        dueDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        driverId: driver.id,
      },
      {
        title: 'Defensive Driving Certification Renewal',
        description: '6‑hour defensive driving course, overdue.',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'EXPIRED',
        driverId: driver.id,
      },
    ],
  });

  // Optional notification
  await prisma.notification.create({
    data: {
      userId: driver.id,
      title: 'Welcome to JNI Solutions',
      message: 'Your driver account has been set up.',
      body: 'Welcome, Alex!',
      type: 'INFO',
      channel: 'IN_APP',
      status: 'PENDING',
    },
  });

  console.log('Phase A seeding completed.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
