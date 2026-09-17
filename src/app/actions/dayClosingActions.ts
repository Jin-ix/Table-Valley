'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function closeDayAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const openingCash = parseFloat(formData.get('openingCash') as string) || 0;
  const actualCash  = parseFloat(formData.get('actualCash') as string) || 0;

  // Today in local date (YYYY-MM-DD)
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD

  // Aggregate today's completed orders by payment method
  const startOfDay = new Date(`${todayStr}T00:00:00`);
  const endOfDay   = new Date(`${todayStr}T23:59:59`);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: { in: ['COMPLETED', 'PAID'] },
    },
    select: { total: true, paymentMethod: true },
  });

  let cashSales  = 0, upiSales  = 0, cardSales = 0, otherSales = 0;
  for (const o of orders) {
    const pm = (o.paymentMethod || 'OTHER').toUpperCase();
    if (pm === 'CASH')       cashSales  += o.total;
    else if (pm === 'UPI')   upiSales   += o.total;
    else if (pm === 'CARD')  cardSales  += o.total;
    else                     otherSales += o.total;
  }

  const totalSales   = cashSales + upiSales + cardSales + otherSales;
  const expectedCash = openingCash + cashSales;
  const difference   = actualCash - expectedCash;

  const dateValue = new Date(`${todayStr}T00:00:00`);

  const existing = await prisma.dayClosing.findUnique({ where: { date: dateValue } });

  const data = {
    openingCash, cashSales, upiSales, cardSales, otherSales,
    totalSales, expectedCash, actualCash, difference,
    ordersCount: orders.length,
  };

  if (existing) {
    await prisma.dayClosing.update({ where: { id: existing.id }, data });
  } else {
    await prisma.dayClosing.create({ data: { ...data, date: dateValue } });
  }

  revalidatePath('/day-closing');
  revalidatePath('/reports');
  return { success: true, data };
}

export async function getDayClosingHistory(limit = 30) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const history = await prisma.dayClosing.findMany({
    orderBy: { date: 'desc' },
    take: limit,
  });
  return { history };
}
