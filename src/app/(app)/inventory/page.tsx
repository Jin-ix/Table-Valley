import { prisma } from '@/lib/prisma';
import InventoryClient from './InventoryClient';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const [items, transactions] = await Promise.all([
    prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } }),
    prisma.inventoryTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { item: true } })
  ]);

  const mappedItems = items.map(i => ({
    id: i.id,
    name: i.name,
    category: i.category,
    emoji: i.emoji || '📦',
    unit: i.unit,
    unitSize: i.unitSize || '',
    qty: i.qty,
    minQty: i.minQty,
    costPerUnit: i.costPerUnit,
    supplier: i.supplier || '',
  }));

  const mappedTransactions = transactions.map(t => ({
    id: t.id,
    itemName: t.item.name,
    type: t.type as 'IN' | 'OUT',
    qty: t.qty,
    unit: t.item.unit,
    notes: t.notes || '',
    date: format(new Date(t.createdAt), 'MMM dd, h:mm a')
  }));

  return <InventoryClient initialItems={mappedItems} initialTransactions={mappedTransactions} />;
}
