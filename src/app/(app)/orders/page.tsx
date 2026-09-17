import styles from '../shared.module.css';
import { prisma } from '@/lib/prisma';
import OrdersClient from './OrdersClient';

export const revalidate = 30;

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { product: true }
      },
      cashier: true
    }
  });

  return (
    <div className={styles.page}>
      <OrdersClient initialOrders={orders} />
    </div>
  );
}
