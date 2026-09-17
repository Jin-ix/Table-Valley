import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
  }

  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T23:59:59Z`);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: ['COMPLETED', 'PAID'] } // Only count paid/completed for P&L
    },
    select: {
      createdAt: true,
      total: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Aggregate by day
  const dailyStats: Record<string, { revenue: number; orders: number }> = {};

  for (const o of orders) {
    const dStr = new Date(o.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (!dailyStats[dStr]) {
      dailyStats[dStr] = { revenue: 0, orders: 0 };
    }
    dailyStats[dStr].revenue += o.total;
    dailyStats[dStr].orders += 1;
  }

  let csv = 'Date,Total Orders,Daily Revenue (INR),Average Order Value (INR)\n';

  let totalRev = 0;
  let totalOrd = 0;

  Object.entries(dailyStats).forEach(([date, stats]) => {
    const aov = stats.orders > 0 ? Math.round(stats.revenue / stats.orders) : 0;
    csv += `${date},${stats.orders},${stats.revenue},${aov}\n`;
    totalRev += stats.revenue;
    totalOrd += stats.orders;
  });

  // Add a total row
  csv += `\nTOTAL,${totalOrd},${totalRev},${totalOrd > 0 ? Math.round(totalRev/totalOrd) : 0}\n`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="pnl_statement_${start}_to_${end}.csv"`,
    },
  });
}
