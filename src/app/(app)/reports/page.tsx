import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ReportsClient from './ReportsClient';

export const revalidate = 60;

export default async function Reports() {
  const session = await getSession();

  let dayClosings: any[] = [];
  if (session?.role === 'ADMIN') {
    dayClosings = await prisma.dayClosing.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  return <ReportsClient dayClosings={dayClosings} />;
}
