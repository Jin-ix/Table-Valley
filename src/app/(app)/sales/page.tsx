import styles from '../shared.module.css';
import SalesClient from './SalesClient';
import { aggregateDashboardData } from '../dashboard/dataAggregator';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

export default async function SalesPage() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const allOrders = await prisma.order.findMany({
    where: { createdAt: { gte: oneYearAgo } },
    select: {
      createdAt: true,
      total: true,
      type: true,
      status: true,
      paymentMethod: true,
      items: {
        select: {
          qty: true,
          product: {
            select: {
              name: true,
              price: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const dashboardPayload = aggregateDashboardData(allOrders);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Sales Analytics</h1>
          <p className={styles.pageSubtitle}>2026 · Revenue, orders & trends</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>Export</button>
        </div>
      </div>

      <SalesClient payload={dashboardPayload} />
    </div>
  );
}
