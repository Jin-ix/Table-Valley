import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import styles from '../shared.module.css';
import DayClosingClient from './DayClosingClient';

export const revalidate = 0;

export default async function DayClosingPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/dashboard');

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');
  const startOfDay = new Date(`${todayStr}T00:00:00`);
  const endOfDay   = new Date(`${todayStr}T23:59:59`);

  // Today's completed orders grouped by payment method
  const [todayOrders, existingClosing, history] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: { in: ['COMPLETED', 'PAID'] } },
      select: { total: true, paymentMethod: true },
    }),
    prisma.dayClosing.findFirst({
      where: { date: new Date(`${todayStr}T00:00:00`) },
    }),
    prisma.dayClosing.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    }),
  ]);

  let cashSales = 0, upiSales = 0, cardSales = 0, otherSales = 0;
  for (const o of todayOrders) {
    const pm = (o.paymentMethod || 'OTHER').toUpperCase();
    if (pm === 'CASH')      cashSales  += o.total;
    else if (pm === 'UPI')  upiSales   += o.total;
    else if (pm === 'CARD') cardSales  += o.total;
    else                    otherSales += o.total;
  }

  const todaySummary = {
    cashSales, upiSales, cardSales, otherSales,
    totalSales: cashSales + upiSales + cardSales + otherSales,
    ordersCount: todayOrders.length,
    todayStr,
    existingClosing,
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Day Closing</h1>
          <p className={styles.pageSubtitle}>
            {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      <DayClosingClient todaySummary={todaySummary} history={history} />
    </div>
  );
}
