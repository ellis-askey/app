// prisma/seed.ts
// Populates the database with demo data for development

import { PrismaClient, UserRole, TransactionStatus, ContactRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data in dependency order
  await prisma.contact.deleteMany();
  await prisma.propertyTransaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.agency.deleteMany();

  // ─── Agency ───────────────────────────────────────────────────────────────

  const agency = await prisma.agency.create({
    data: {
      name: "Hartwell & Partners",
    },
  });

  console.log(`✓ Agency: ${agency.name}`);

  // ─── Users ────────────────────────────────────────────────────────────────

  const adminUser = await prisma.user.create({
    data: {
      name: "Sarah Hartwell",
      email: "sarah@hartwellpartners.co.uk",
      role: UserRole.admin,
      agencyId: agency.id,
    },
  });

  const progressorUser = await prisma.user.create({
    data: {
      name: "James Okafor",
      email: "james@hartwellpartners.co.uk",
      role: UserRole.sales_progressor,
      agencyId: agency.id,
    },
  });

  const negotiatorUser = await prisma.user.create({
    data: {
      name: "Emily Chen",
      email: "emily@hartwellpartners.co.uk",
      role: UserRole.negotiator,
      agencyId: agency.id,
    },
  });

  console.log(`✓ Users: ${adminUser.name}, ${progressorUser.name}, ${negotiatorUser.name}`);

  // ─── Transactions ─────────────────────────────────────────────────────────

  const tx1 = await prisma.propertyTransaction.create({
    data: {
      propertyAddress: "14 Elmwood Avenue, Bristol, BS6 7TH",
      status: TransactionStatus.active,
      agencyId: agency.id,
      assignedUserId: progressorUser.id,
      expectedExchangeDate: new Date("2025-06-15"),
    },
  });

  const tx2 = await prisma.propertyTransaction.create({
    data: {
      propertyAddress: "Flat 3, Clarence House, Bath Road, Bristol, BS4 2EQ",
      status: TransactionStatus.active,
      agencyId: agency.id,
      assignedUserId: progressorUser.id,
      expectedExchangeDate: new Date("2025-07-01"),
    },
  });

  const tx3 = await prisma.propertyTransaction.create({
    data: {
      propertyAddress: "22 Pemberton Road, Clifton, Bristol, BS8 2YU",
      status: TransactionStatus.on_hold,
      agencyId: agency.id,
      assignedUserId: negotiatorUser.id,
      expectedExchangeDate: null,
    },
  });

  const tx4 = await prisma.propertyTransaction.create({
    data: {
      propertyAddress: "9 Harbour View, Portishead, BS20 6AJ",
      status: TransactionStatus.completed,
      agencyId: agency.id,
      assignedUserId: adminUser.id,
      expectedExchangeDate: new Date("2025-03-20"),
    },
  });

  console.log(`✓ Transactions: ${tx1.propertyAddress}, ${tx2.propertyAddress}, ${tx3.propertyAddress}, ${tx4.propertyAddress}`);

  // ─── Contacts ─────────────────────────────────────────────────────────────

  await prisma.contact.createMany({
    data: [
      // tx1 contacts
      {
        propertyTransactionId: tx1.id,
        name: "Robert Fielding",
        email: "r.fielding@email.com",
        phone: "07712 334 556",
        roleType: ContactRole.vendor,
      },
      {
        propertyTransactionId: tx1.id,
        name: "Anna Fielding",
        email: "anna.fielding@email.com",
        phone: "07712 334 557",
        roleType: ContactRole.vendor,
      },
      {
        propertyTransactionId: tx1.id,
        name: "Marcus Webb",
        email: "m.webb@email.com",
        phone: "07890 123 456",
        roleType: ContactRole.purchaser,
      },
      {
        propertyTransactionId: tx1.id,
        name: "Thornton & Co Solicitors",
        email: "conveyancing@thorntonco.co.uk",
        phone: "0117 922 3400",
        roleType: ContactRole.solicitor,
      },
      // tx2 contacts
      {
        propertyTransactionId: tx2.id,
        name: "Priya Sharma",
        email: "priya.sharma@email.com",
        phone: "07654 321 987",
        roleType: ContactRole.purchaser,
      },
      {
        propertyTransactionId: tx2.id,
        name: "Devlin Law LLP",
        email: "property@devlinlaw.co.uk",
        phone: "0117 900 1234",
        roleType: ContactRole.solicitor,
      },
      {
        propertyTransactionId: tx2.id,
        name: "First Direct Mortgages",
        email: "brokers@firstdirect.co.uk",
        phone: "0345 600 2290",
        roleType: ContactRole.broker,
      },
      // tx3 contacts
      {
        propertyTransactionId: tx3.id,
        name: "George Whitmore",
        email: "g.whitmore@email.com",
        phone: "07811 445 667",
        roleType: ContactRole.vendor,
      },
      {
        propertyTransactionId: tx3.id,
        name: "Claire Nguyen",
        email: "claire.n@email.com",
        phone: "07944 556 778",
        roleType: ContactRole.purchaser,
      },
    ],
  });

  console.log("✓ Contacts seeded");
  console.log("\n✅ Seed complete.");
  console.log("\nDemo login (use with credentials provider or dev bypass):");
  console.log("  Email: sarah@hartwellpartners.co.uk  — Admin");
  console.log("  Email: james@hartwellpartners.co.uk  — Sales Progressor");
  console.log("  Email: emily@hartwellpartners.co.uk  — Negotiator");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
