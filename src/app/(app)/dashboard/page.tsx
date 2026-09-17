import styles from '../shared.module.css';
import DashboardClient from './DashboardClient';
import { aggregateDashboardData } from './dataAggregator';

import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Paid: styles.badgeGreen, Preparing: styles.badgeOrange,
    Serving: styles.badgeBlue, Cancelled: styles.badgeRed,
  };
  return `${styles.badge} ${map[s] ?? styles.badgeGray}`;
}

export const revalidate = 60;
export default async function Dashboard() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [recentOrders, allOrders] = await Promise.all([
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        tableNumber: true,
        type: true,
        total: true,
        status: true,
        createdAt: true,
        items: { select: { qty: true } },
      },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: oneYearAgo } },
      select: {
        createdAt: true,
        total: true,
        type: true,
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
    }),
  ]);

  const dashboardPayload = aggregateDashboardData(allOrders);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Live overview</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>Export</button>
          <a href="/pos" className={styles.btnPrimary}>+ New Order</a>
        </div>
      </div>

      {/* Interactive charts & stats (client component) */}
      <DashboardClient payload={dashboardPayload} />

      {/* Recent Orders (server-rendered) */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Recent Orders</span>
          <a href="/orders" className={styles.btnSecondary} style={{fontSize:'0.8rem', padding:'0.4rem 0.875rem'}}>View all</a>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>Order ID</th><th>Table</th><th>Items</th><th>Type</th><th>Total</th><th>Status</th><th>Time</th></tr>
          </thead>
          <tbody>
            {recentOrders.map(o => (
              <tr key={o.id}>
                <td><span style={{fontWeight:700, color:'#fff'}}>{o.orderNumber}</span></td>
                <td>{o.tableNumber || '—'}</td>
                <td>{o.items.reduce((acc, item) => acc + item.qty, 0)} items</td>
                <td><span className={`${styles.badge} ${styles.badgeGray}`}>{o.type === 'DINE_IN' ? 'Dine In' : 'Take Away'}</span></td>
                <td><span style={{fontWeight:700, color:'rgba(255,255,255,0.85)'}}>₹{o.total.toLocaleString('en-IN')}</span></td>
                <td><span className={statusBadge(o.status === 'COMPLETED' ? 'Paid' : o.status === 'PREPARING' ? 'Preparing' : o.status === 'SERVED' ? 'Serving' : 'Paid')}>{o.status === 'COMPLETED' ? 'Paid' : o.status === 'PREPARING' ? 'Preparing' : o.status === 'SERVED' ? 'Serving' : o.status}</span></td>
                <td>{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
