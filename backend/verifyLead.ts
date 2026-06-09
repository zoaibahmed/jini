import { PrismaClient, LeadStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing prisma.lead.create...');
  try {
    const lead = await prisma.lead.create({
      data: {
        name: 'Test Lead',
        phone: '+15555555555',
        email: 'test@example.com',
        source: 'Google',
        notes: 'Some notes',
        status: LeadStatus.NEW,
      } as any
    });
    console.log('Created Lead successfully:', lead);
    
    // Now delete it
    await prisma.lead.delete({
      where: { id: lead.id }
    });
    console.log('Deleted Test Lead.');
  } catch (err) {
    console.error('Error creating/deleting lead:', err);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
