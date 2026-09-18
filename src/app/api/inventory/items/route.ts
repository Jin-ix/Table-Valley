import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (id) {
      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: {
          name: data.name,
          category: data.category,
          emoji: data.emoji,
          unit: data.unit,
          unitSize: data.unitSize || null,
          qty: data.qty,
          minQty: data.minQty,
          costPerUnit: data.costPerUnit,
          supplier: data.supplier || null,
        },
      });
      return NextResponse.json({ success: true, item: updated });
    } else {
      const created = await prisma.inventoryItem.create({
        data: {
          name: data.name,
          category: data.category,
          emoji: data.emoji,
          unit: data.unit,
          unitSize: data.unitSize || null,
          qty: data.qty,
          minQty: data.minQty,
          costPerUnit: data.costPerUnit,
          supplier: data.supplier || null,
        },
      });
      return NextResponse.json({ success: true, item: created });
    }
  } catch (e: any) {
    console.error('[INVENTORY] Save error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[INVENTORY] Delete error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
