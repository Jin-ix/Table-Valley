const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE SEQUENCE IF NOT EXISTS order_number_seq
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1
  `);
  const result = await prisma.$executeRawUnsafe(`
    SELECT setval('order_number_seq', COALESCE((SELECT COUNT(*) FROM orders), 0)::bigint, true)
  `);
  console.log('✓ Sequence created and synced to current order count.');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
