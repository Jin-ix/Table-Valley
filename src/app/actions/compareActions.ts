'use server';

import { prisma } from '@/lib/prisma';

function getHourIndex(hour: number) {
  if (hour < 9) return 0;
  if (hour > 22) return 13;
  return hour - 9;
}

function getDayIndex(day: number) {
  return day === 0 ? 6 : day - 1;
}

function initBuckets(length: number, labels: string[]) {
  return {
    labels,
    revenue: Array(length).fill(0),
    orders: Array(length).fill(0),
    covers: Array(length).fill(0),
    aov: Array(length).fill(0),
  };
}

export async function fetchComparison(
  periodType: 'day' | 'week' | 'month',
  startA: string, endA: string,
  startB: string, endB: string
) {
  const dStartA = new Date(startA);
  const dEndA = new Date(endA);
  const dStartB = new Date(startB);
  const dEndB = new Date(endB);

  // Fetch orders for both ranges
  const [ordersA, ordersB] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: dStartA, lte: dEndA } },
      select: { createdAt: true, total: true, items: { select: { qty: true } }, status: true }
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: dStartB, lte: dEndB } },
      select: { createdAt: true, total: true, items: { select: { qty: true } }, status: true }
    })
  ]);

  // Determine buckets based on periodType
  let labels: string[] = [];
  let numBuckets = 0;
  if (periodType === 'day') {
    labels = ['9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM'];
    numBuckets = 14;
  } else if (periodType === 'week') {
    labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    numBuckets = 7;
  } else if (periodType === 'month') {
    // We use the length of month A to determine labels
    const daysInMonth = new Date(dStartA.getFullYear(), dStartA.getMonth() + 1, 0).getDate();
    labels = Array.from({length: daysInMonth}, (_, i) => `${i+1}`);
    numBuckets = daysInMonth;
  }

  const bucketA = initBuckets(numBuckets, labels);
  const bucketB = initBuckets(numBuckets, labels);

  const statsA = { revenue: 0, orders: 0, items: 0, cancellations: 0 };
  const statsB = { revenue: 0, orders: 0, items: 0, cancellations: 0 };

  const processOrders = (orders: any[], bucket: any, stats: any, isMonthB: boolean = false) => {
    for (const order of orders) {
      const d = new Date(order.createdAt);
      let idx = 0;
      if (periodType === 'day') idx = getHourIndex(d.getHours());
      else if (periodType === 'week') idx = getDayIndex(d.getDay());
      else if (periodType === 'month') {
        idx = d.getDate() - 1;
        // If month B is longer than month A, don't crash
        if (idx >= numBuckets) idx = numBuckets - 1; 
      }

      const itemsCount = order.items.reduce((acc: number, i: any) => acc + i.qty, 0);

      bucket.revenue[idx] += order.total;
      bucket.orders[idx] += 1;
      bucket.covers[idx] += itemsCount;

      stats.revenue += order.total;
      stats.orders += 1;
      stats.items += itemsCount;
      if (order.status === 'CANCELLED') stats.cancellations += 1;
    }

    // Calc AOV
    for (let i = 0; i < bucket.revenue.length; i++) {
      bucket.aov[i] = bucket.orders[i] ? Math.round(bucket.revenue[i] / bucket.orders[i]) : 0;
    }
  };

  processOrders(ordersA, bucketA, statsA);
  processOrders(ordersB, bucketB, statsB, true);

  return {
    labels,
    dataA: bucketA,
    dataB: bucketB,
    statsA,
    statsB
  };
}
