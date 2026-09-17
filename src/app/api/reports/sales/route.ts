import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
  }

  // Use local server timezone by omitting the 'Z'
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59`);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const header = 'Order Number,Date,Time,Type,Payment Method,Status,Items Count,Subtotal,Tax,Total,Cashier\n';
      controller.enqueue(encoder.encode(header));

      let skip = 0;
      const take = 500;
      let hasMore = true;

      try {
        while (hasMore) {
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
            skip,
            take,
          });

          if (orders.length === 0) {
            hasMore = false;
            break;
          }

          let chunk = '';
          for (const o of orders) {
            const d = new Date(o.createdAt);
            const dateStr = d.toLocaleDateString('en-IN');
            const timeStr = d.toLocaleTimeString('en-IN');
            const itemsCount = o.items.reduce((acc: any, i: any) => acc + i.qty, 0);

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

            chunk += row + '\n';
          }

          controller.enqueue(encoder.encode(chunk));
          skip += take;

          if (orders.length < take) {
            hasMore = false;
          }
        }
      } catch (err) {
        console.error('Error streaming CSV:', err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sales_report_${start}_to_${end}.csv"`,
    },
  });
}
