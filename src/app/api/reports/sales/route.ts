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
    },
    include: {
      items: true,
      cashier: { select: { name: true } },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Generate CSV
  let csv = 'Order Number,Date,Time,Type,Payment Method,Status,Items Count,Subtotal,Tax,Total,Cashier\n';

  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const dateStr = d.toLocaleDateString('en-IN');
    const timeStr = d.toLocaleTimeString('en-IN');
    const itemsCount = o.items.reduce((acc, i) => acc + i.qty, 0);

    const row = [
      o.orderNumber,
      dateStr,
      timeStr,
      o.type,
      o.paymentMethod || 'N/A',
      o.status,
      itemsCount,
      o.subtotal,
      o.tax,
      o.total,
      o.cashier?.name || 'Unknown',
    ].map((val) => `"${val}"`).join(',');

    csv += row + '\n';
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sales_report_${start}_to_${end}.csv"`,
    },
  });
}
