import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { id, newQty, type, delta, notes } = await req.json();
    
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
          notes: notes || null,
        },
      }),
    ]);
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[INVENTORY] Adjust error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
