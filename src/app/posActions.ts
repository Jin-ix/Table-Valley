'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createOrder(data: {
  type: string;
  tableNumber?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashierId: string;
  items: {
    productId: string;
    qty: number;
    price: number;
    notes: string;
  }[];
}) {
  // 1. Generate a collision-safe order number using a DB sequence
  //    nextval is atomic — no race condition, no COUNT(*) table scan
  const seqResult = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('order_number_seq')
  `;
  const orderNumber = `VT-${seqResult[0].nextval.toString().padStart(4, '0')}`;

  // 2. Create Order & Items — no include on response (caller only needs the id)
  const order = await prisma.order.create({
    data: {
      orderNumber,
      type: data.type,
      tableNumber: data.tableNumber,
      status: 'COMPLETED',
      subtotal: data.subtotal,
      tax: data.tax,
      discount: data.discount,
      total: data.total,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'PAID',
      cashierId: data.cashierId,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          notes: item.notes,
        })),
      },
    },
    select: { id: true, orderNumber: true },
  });

  revalidatePath('/orders');
  revalidatePath('/dashboard');
  return order;
}

