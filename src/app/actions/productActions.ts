"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addProduct(data: { name: string, categoryName: string, price: number, notes?: string, available: boolean }) {
  const category = await prisma.category.upsert({
    where: { name: data.categoryName },
    update: {},
    create: { name: data.categoryName }
  });

  const sku = data.name.replace(/\s+/g, '-').toUpperCase() + '-' + Date.now();

  await prisma.product.create({
    data: {
      name: data.name,
      sku: sku,
      price: data.price,
      categoryId: category.id,
      available: data.available,
      trackStock: false,
    }
  });

  revalidatePath('/products');
  revalidatePath('/pos');
}

export async function updateProduct(id: string, data: { name: string, categoryName: string, price: number, notes?: string, available: boolean }) {
  const category = await prisma.category.upsert({
    where: { name: data.categoryName },
    update: {},
    create: { name: data.categoryName }
  });

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      categoryId: category.id,
      available: data.available,
    }
  });

  revalidatePath('/products');
  revalidatePath('/pos');
}

export async function deleteProduct(id: string) {
  // Rather than hard-delete which might break orders, we just mark as unavailable or we can delete if no orders
  try {
    await prisma.product.delete({
      where: { id }
    });
  } catch(e) {
    // If it fails (likely due to FK constraint from orders), mark it unavailable instead
    await prisma.product.update({
      where: { id },
      data: { available: false }
    });
  }
  revalidatePath('/products');
  revalidatePath('/pos');
}

export async function toggleProductAvailability(id: string, available: boolean) {
  await prisma.product.update({
    where: { id },
    data: { available }
  });
  revalidatePath('/products');
  revalidatePath('/pos');
}
