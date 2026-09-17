const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:ValleyTable2026%40@db.xjxypoqqdyuaamlvdzpr.supabase.co:5432/postgres'
});
prisma.product.count()
  .then(c => console.log('Count:', c))
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
