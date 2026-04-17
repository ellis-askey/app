// prisma/seed.ts
// Sprint 2: adds MilestoneDefinition seeds (all PM + VM codes in order)

import {
  PrismaClient,
  UserRole,
  TransactionStatus,
  ContactRole,
  MilestoneSide,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Clean in dependency order ────────────────────────────────────────────
  await prisma.milestoneCompletion.deleteMany();
  await prisma.milestoneDefinition.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.propertyTransaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.agency.deleteMany();

  // ─── Agency ───────────────────────────────────────────────────────────────
  const agency = await prisma.agency.create({ data: { name: "Hartwell & Partners" } });
  console.log(`✓ Agency: ${agency.name}`);

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: { name: "Sarah Hartwell", email: "sarah@hartwellpartners.co.uk", role: UserRole.admin, agencyId: agency.id },
  });
  const progressorUser = await prisma.user.create({
    data: { name: "James Okafor", email: "james@hartwellpartners.co.uk", role: UserRole.sales_progressor, agencyId: agency.id },
  });
  const negotiatorUser = await prisma.user.create({
    data: { name: "Emily Chen", email: "emily@hartwellpartners.co.uk", role: UserRole.negotiator, agencyId: agency.id },
  });
  console.log(`✓ Users: ${adminUser.name}, ${progressorUser.name}, ${negotiatorUser.name}`);

  // ─── Milestone Definitions ────────────────────────────────────────────────
  // Purchaser milestones — in chronological order
  // All block exchange except PM27 (exchange gate), PM16/PM17 (post-exchange)
  const purchaserMilestones = [
    { code: "PM1",   name: "Buyer has instructed their solicitor",                                           orderIndex: 1,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM2",   name: "Buyer has received the memorandum of sale",                                      orderIndex: 2,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM14a", name: "Buyer has completed ID and AML checks with their solicitor",                     orderIndex: 3,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM15a", name: "Buyer has paid money on account to their solicitor",                             orderIndex: 4,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM4",   name: "Buyer has submitted their mortgage application",                                  orderIndex: 5,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM5",   name: "Lender valuation has been booked",                                               orderIndex: 6,  blocksExchange: true,  timeSensitive: true,  isExchangeGate: false, isPostExchange: false },
    { code: "PM3",   name: "Buyer's solicitor has received the draft contract pack",                         orderIndex: 7,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM9",   name: "Buyer's solicitor has ordered searches",                                         orderIndex: 8,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM7",   name: "Buyer has booked a Level 2 or Level 3 survey",                                  orderIndex: 9,  blocksExchange: true,  timeSensitive: true,  isExchangeGate: false, isPostExchange: false },
    { code: "PM20",  name: "Buyer has received the survey report",                                           orderIndex: 10, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM6",   name: "Buyer's solicitor has received the mortgage offer",                              orderIndex: 11, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM10",  name: "Buyer's solicitor has received the search results",                              orderIndex: 12, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM11",  name: "Buyer's solicitor has raised initial enquiries to the seller's solicitor",      orderIndex: 13, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM21",  name: "Buyer's solicitor has received initial replies from the seller's solicitor",    orderIndex: 14, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM22",  name: "Buyer's solicitor has reviewed the initial replies",                             orderIndex: 15, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM12",  name: "Buyer's solicitor has raised additional enquiries",                              orderIndex: 16, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM23",  name: "Buyer's solicitor has received additional replies",                              orderIndex: 17, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM24",  name: "Buyer's solicitor has reviewed the additional replies",                          orderIndex: 18, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM25",  name: "Buyer's solicitor has confirmed all enquiries are now satisfied",                orderIndex: 19, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM26",  name: "Buyer has received the final report from their solicitor",                       orderIndex: 20, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM13",  name: "Buyer's solicitor has issued contract documents to the buyer",                  orderIndex: 21, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM14b", name: "Buyer's solicitor has received the signed contract documents back from the buyer", orderIndex: 22, blocksExchange: true, timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM15b", name: "Buyer has transferred the deposit",                                              orderIndex: 23, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "PM27",  name: "Buyer's solicitor has confirmed readiness to exchange",                          orderIndex: 24, blocksExchange: false, timeSensitive: false, isExchangeGate: true,  isPostExchange: false },
    { code: "PM16",  name: "Buyer has received confirmation that contracts have exchanged",                  orderIndex: 25, blocksExchange: false, timeSensitive: false, isExchangeGate: false, isPostExchange: true  },
    { code: "PM17",  name: "Buyer has received confirmation that the sale has completed",                    orderIndex: 26, blocksExchange: false, timeSensitive: false, isExchangeGate: false, isPostExchange: true  },
  ];

  // Vendor milestones — in chronological order
  const vendorMilestones = [
    { code: "VM1",  name: "Seller has instructed their solicitor",                                            orderIndex: 1,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM2",  name: "Seller has received the memorandum of sale",                                      orderIndex: 2,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM3",  name: "Seller has received the welcome pack from their solicitor",                       orderIndex: 3,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM14", name: "Seller has completed ID and AML checks with their solicitor",                     orderIndex: 4,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM15", name: "Seller has received the property information forms from their solicitor",         orderIndex: 5,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM4",  name: "Seller has returned completed property information forms to their solicitor",     orderIndex: 6,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM5",  name: "Seller's solicitor has issued the draft contract pack",                           orderIndex: 7,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM6",  name: "Seller's solicitor has requested the management pack",                            orderIndex: 8,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM7",  name: "Seller's solicitor has received the management pack",                             orderIndex: 9,  blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM16", name: "Seller's solicitor has received initial enquiries",                               orderIndex: 10, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM17", name: "Seller has provided initial replies to their solicitor",                          orderIndex: 11, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM8",  name: "Seller's solicitor has issued initial responses to the buyer's solicitor",       orderIndex: 12, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM18", name: "Seller's solicitor has received additional enquiries",                            orderIndex: 13, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM19", name: "Seller has provided additional replies to their solicitor",                       orderIndex: 14, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM9",  name: "Seller's solicitor has issued additional responses to the buyer's solicitor",    orderIndex: 15, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM10", name: "Seller's solicitor has issued contract documents to the seller",                  orderIndex: 16, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM11", name: "Seller's solicitor has received signed contract documents back from the seller", orderIndex: 17, blocksExchange: true,  timeSensitive: false, isExchangeGate: false, isPostExchange: false },
    { code: "VM20", name: "Seller's solicitor has confirmed readiness to exchange",                          orderIndex: 18, blocksExchange: false, timeSensitive: false, isExchangeGate: true,  isPostExchange: false },
    { code: "VM12", name: "Seller has received confirmation that contracts have exchanged",                  orderIndex: 19, blocksExchange: false, timeSensitive: false, isExchangeGate: false, isPostExchange: true  },
    { code: "VM13", name: "Seller has received confirmation that the sale has completed",                    orderIndex: 20, blocksExchange: false, timeSensitive: false, isExchangeGate: false, isPostExchange: true  },
  ];

  for (const m of purchaserMilestones) {
    await prisma.milestoneDefinition.create({ data: { ...m, side: MilestoneSide.purchaser } });
  }
  for (const m of vendorMilestones) {
    await prisma.milestoneDefinition.create({ data: { ...m, side: MilestoneSide.vendor } });
  }
  console.log(`✓ Milestone definitions: ${purchaserMilestones.length} purchaser, ${vendorMilestones.length} vendor`);

  // ─── Transactions ─────────────────────────────────────────────────────────
  const tx1 = await prisma.propertyTransaction.create({
    data: { propertyAddress: "14 Elmwood Avenue, Bristol, BS6 7TH", status: TransactionStatus.active, agencyId: agency.id, assignedUserId: progressorUser.id, expectedExchangeDate: new Date("2025-06-15") },
  });
  const tx2 = await prisma.propertyTransaction.create({
    data: { propertyAddress: "Flat 3, Clarence House, Bath Road, Bristol, BS4 2EQ", status: TransactionStatus.active, agencyId: agency.id, assignedUserId: progressorUser.id, expectedExchangeDate: new Date("2025-07-01") },
  });
  const tx3 = await prisma.propertyTransaction.create({
    data: { propertyAddress: "22 Pemberton Road, Clifton, Bristol, BS8 2YU", status: TransactionStatus.on_hold, agencyId: agency.id, assignedUserId: negotiatorUser.id },
  });
  const tx4 = await prisma.propertyTransaction.create({
    data: { propertyAddress: "9 Harbour View, Portishead, BS20 6AJ", status: TransactionStatus.completed, agencyId: agency.id, assignedUserId: adminUser.id, expectedExchangeDate: new Date("2025-03-20") },
  });
  console.log(`✓ Transactions: 4`);

  // ─── Demo milestone completions on tx1 (first 7 purchaser, first 5 vendor) ─
  const allPM = await prisma.milestoneDefinition.findMany({ where: { side: "purchaser" }, orderBy: { orderIndex: "asc" } });
  const allVM = await prisma.milestoneDefinition.findMany({ where: { side: "vendor" }, orderBy: { orderIndex: "asc" } });

  // Complete first 7 purchaser milestones on tx1
  for (const m of allPM.slice(0, 7)) {
    await prisma.milestoneCompletion.create({
      data: {
        transactionId: tx1.id,
        milestoneDefinitionId: m.id,
        isActive: true,
        completedAt: new Date(Date.now() - Math.random() * 14 * 86400000),
        completedById: progressorUser.id,
      },
    });
  }

  // Complete first 5 vendor milestones on tx1
  for (const m of allVM.slice(0, 5)) {
    await prisma.milestoneCompletion.create({
      data: {
        transactionId: tx1.id,
        milestoneDefinitionId: m.id,
        isActive: true,
        completedAt: new Date(Date.now() - Math.random() * 14 * 86400000),
        completedById: progressorUser.id,
      },
    });
  }

  // Complete first 3 purchaser on tx2
  for (const m of allPM.slice(0, 3)) {
    await prisma.milestoneCompletion.create({
      data: {
        transactionId: tx2.id,
        milestoneDefinitionId: m.id,
        isActive: true,
        completedAt: new Date(Date.now() - Math.random() * 7 * 86400000),
        completedById: progressorUser.id,
      },
    });
  }

  console.log(`✓ Demo milestone completions seeded`);

  // ─── Contacts ─────────────────────────────────────────────────────────────
  await prisma.contact.createMany({
    data: [
      { propertyTransactionId: tx1.id, name: "Robert Fielding", email: "r.fielding@email.com", phone: "07712 334 556", roleType: ContactRole.vendor },
      { propertyTransactionId: tx1.id, name: "Anna Fielding", email: "anna.fielding@email.com", phone: "07712 334 557", roleType: ContactRole.vendor },
      { propertyTransactionId: tx1.id, name: "Marcus Webb", email: "m.webb@email.com", phone: "07890 123 456", roleType: ContactRole.purchaser },
      { propertyTransactionId: tx1.id, name: "Thornton & Co Solicitors", email: "conveyancing@thorntonco.co.uk", phone: "0117 922 3400", roleType: ContactRole.solicitor },
      { propertyTransactionId: tx2.id, name: "Priya Sharma", email: "priya.sharma@email.com", phone: "07654 321 987", roleType: ContactRole.purchaser },
      { propertyTransactionId: tx2.id, name: "Devlin Law LLP", email: "property@devlinlaw.co.uk", phone: "0117 900 1234", roleType: ContactRole.solicitor },
      { propertyTransactionId: tx2.id, name: "First Direct Mortgages", email: "brokers@firstdirect.co.uk", phone: "0345 600 2290", roleType: ContactRole.broker },
      { propertyTransactionId: tx3.id, name: "George Whitmore", email: "g.whitmore@email.com", phone: "07811 445 667", roleType: ContactRole.vendor },
      { propertyTransactionId: tx3.id, name: "Claire Nguyen", email: "claire.n@email.com", phone: "07944 556 778", roleType: ContactRole.purchaser },
    ],
  });
  console.log("✓ Contacts seeded");
  console.log("\n✅ Seed complete.");
  console.log("  sarah@hartwellpartners.co.uk — Admin");
  console.log("  james@hartwellpartners.co.uk — Sales Progressor");
  console.log("  emily@hartwellpartners.co.uk — Negotiator");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
