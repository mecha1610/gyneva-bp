import { PrismaClient } from '@prisma/client';
import { DEFAULT_BUSINESS_PLAN_DATA } from '../lib/constants.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed allowed emails
  const allowedEmails = [
    'marine.claver29@gmail.com',
    'electronight@gmail.com',
    'heiner.a.weber@gmail.com',
  ];

  for (const email of allowedEmails) {
    await prisma.allowedEmail.upsert({
      where: { email },
      update: {},
      create: { email, addedBy: 'seed' },
    });
    console.log(`  Allowed email: ${email}`);
  }

  // 2. Seed admin user (marine.claver29@gmail.com)
  const adminUser = await prisma.user.upsert({
    where: { email: 'marine.claver29@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'marine.claver29@gmail.com',
      name: 'Marine Claver',
      role: 'ADMIN',
    },
  });
  console.log(`  Admin user: ${adminUser.email} (${adminUser.id})`);

  // 3. Seed editor user
  const editorUser = await prisma.user.upsert({
    where: { email: 'electronight@gmail.com' },
    update: { role: 'EDITOR' },
    create: {
      email: 'electronight@gmail.com',
      name: 'Thomas',
      role: 'EDITOR',
    },
  });
  console.log(`  Editor user: ${editorUser.email} (${editorUser.id})`);

  // 4. Seed default business plan
  const defaults = DEFAULT_BUSINESS_PLAN_DATA;
  const existingPlan = await prisma.businessPlan.findFirst({
    where: { userId: adminUser.id, name: 'GYNEVA — Business Plan Initial' },
  });

  if (!existingPlan) {
    const plan = await prisma.businessPlan.create({
      data: {
        userId: adminUser.id,
        name: 'GYNEVA — Business Plan Initial',
        data: {
          ca: defaults.ca, caAssoc: defaults.caAssoc, caIndep: defaults.caIndep,
          caInterne: defaults.caInterne, caSage: defaults.caSage,
          result: defaults.result, cashflow: defaults.cashflow,
          treso1m: defaults.treso1m, treso3m: defaults.treso3m,
          admin: defaults.admin, opex: defaults.opex, lab: defaults.lab,
          fteAssoc: defaults.fteAssoc, fteIndep: defaults.fteIndep,
          fteInterne: defaults.fteInterne, fteAdmin: defaults.fteAdmin,
          fteTotal: defaults.fteTotal,
        },
        consultDay: defaults.consultDay,
        fee: defaults.fee,
        daysYear: defaults.daysYear,
        revSpec: defaults.revSpec,
        capex: defaults.capex,
      },
    });
    console.log(`  Business plan: ${plan.name} (${plan.id})`);
  } else {
    console.log(`  Business plan already exists: ${existingPlan.name}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
