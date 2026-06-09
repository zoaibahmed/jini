import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users count:', users.length);
  console.log('Roles:', users.map(u => u.role));

  const dp = await prisma.driverProfile.findMany();
  console.log('DriverProfiles count:', dp.length);

  const vehicles = await prisma.vehicle.findMany();
  console.log('Vehicles count:', vehicles.length);

  const checks = await prisma.complianceCheck.findMany();
  console.log('ComplianceChecks count:', checks.length);

  const notifications = await prisma.notification.findMany();
  console.log('Notifications count:', notifications.length);
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
