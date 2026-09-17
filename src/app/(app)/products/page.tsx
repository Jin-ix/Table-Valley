import { prisma } from "@/lib/prisma";
import ProductsClient from "./ProductsClient";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  // Need to map the schema notes. Actually the schema doesn't have a notes column for products, 
  // but it wasn't requested anyway. For simplicity we can pass the products.
  
  // Wait, let's verify if `Product` has a `notes` field in Prisma schema. 
  // From schema.prisma earlier: model Product { id, name, sku, price, cost, stock, minStock, trackStock, available, imageUrl, categoryId, category, createdAt, updatedAt, orderItems }
  // It does NOT have notes! So `notes` in our frontend will just be ignored in DB but that's fine for now, we can omit it or keep it as UI-only.
  
  return (
    <ProductsClient initialProducts={products as any} />
  );
}
