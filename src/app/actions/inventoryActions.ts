'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveInventoryItem(id: string | undefined, data: any) {
  try {
    if (id) {
      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: {
          name: data.name,
          category: data.category,
          emoji: data.emoji,
          unit: data.unit,
          unitSize: data.unitSize,
          qty: data.qty,
          minQty: data.minQty,
          costPerUnit: data.costPerUnit,
          supplier: data.supplier,
        },
      });
      revalidatePath('/inventory');
      return { success: true, item: updated };
    } else {
      const created = await prisma.inventoryItem.create({
        data: {
          name: data.name,
          category: data.category,
          emoji: data.emoji,
          unit: data.unit,
          unitSize: data.unitSize,
          qty: data.qty,
          minQty: data.minQty,
          costPerUnit: data.costPerUnit,
          supplier: data.supplier,
        },
      });
      revalidatePath('/inventory');
      return { success: true, item: created };
    }
  } catch (e: any) {
    console.error("saveInventoryItem Error:", e);
    return { success: false, error: e.message };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    await prisma.inventoryItem.delete({
      where: { id },
    });
    revalidatePath('/inventory');
    return { success: true };
  } catch (e: any) {
    console.error("deleteInventoryItem Error:", e);
    return { success: false, error: e.message };
  }
}

export async function adjustInventoryQuantity(id: string, newQty: number, type: 'IN' | 'OUT', delta: number, notes: string) {
  try {
    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id },
        data: { qty: newQty },
      }),
      prisma.inventoryTransaction.create({
        data: {
          itemId: id,
          type,
          qty: delta,
          notes,
        },
      }),
    ]);
    revalidatePath('/inventory');
    return { success: true };
  } catch (e: any) {
    console.error("adjustInventoryQuantity Error:", e);
    return { success: false, error: e.message };
  }
}
