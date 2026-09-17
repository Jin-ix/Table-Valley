import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import styles from '../shared.module.css';
import UsersClient from './UsersClient';

export const revalidate = 0;

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/dashboard');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, username: true, role: true, status: true, createdAt: true },
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>User Management</h1>
          <p className={styles.pageSubtitle}>Manage admin and cashier login accounts</p>
        </div>
      </div>
      <UsersClient initialUsers={users} currentUserId={session.userId} />
    </div>
  );
}
