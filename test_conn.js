const { PrismaClient } = require('@prisma/client');

async function test(url) {
  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    await prisma.$connect();
    console.log('SUCCESS:', url);
  } catch (e) {
    console.error('FAIL:', url, '->', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const urls = [
    // Pooler port 6543 with tenant suffix
    'postgresql://postgres.xjxypoqqdyuaamlvdzpr:ValleyTable2026%40@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    // Pooler port 6543 without tenant suffix
    'postgresql://postgres:ValleyTable2026%40@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    // Pooler port 5432 with tenant suffix
    'postgresql://postgres.xjxypoqqdyuaamlvdzpr:ValleyTable2026%40@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
    // Pooler port 5432 without tenant suffix
    'postgresql://postgres:ValleyTable2026%40@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
  ];

  for (const url of urls) {
    await test(url);
  }
}
run();
