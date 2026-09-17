import { prisma } from "@/lib/prisma";
import POSClient from "../../POSClient";

export const revalidate = 30;

export default async function POSPage() {
  const [products, categories, cashier] = await Promise.all([
    prisma.product.findMany({
      where: { available: true },
      include: { category: true },
    }),
    prisma.category.findMany(),
    prisma.user.findFirst({ where: { role: 'CASHIER' } }),
  ]);

  return (
    <div style={{ height: '100%' }}>
      <POSClient initialProducts={products} categories={categories} currentUserId={cashier?.id ?? ''} />
    </div>
  );
}

