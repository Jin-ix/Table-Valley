import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { username: 'admin@valleytable.com' },
    update: {},
    create: {
      name: 'Admin User',
      username: 'admin@valleytable.com',
      password: 'admin123', // In a real app, hash this!
      role: 'ADMIN'
    }
  });

  const cashier = await prisma.user.upsert({
    where: { username: 'cashier@valleytable.com' },
    update: {},
    create: {
      name: 'Cashier Staff',
      username: 'cashier@valleytable.com',
      password: 'cashier123',
      role: 'CASHIER'
    }
  });

  // 2. Create Categories
  const categoriesData = [
    { name: 'Bread' },
    { name: 'Main Course' },
    { name: 'Starter' },
    { name: 'Breakfast' },
    { name: 'Beverages' }
  ];

  for (const c of categoriesData) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name }
    });
  }

  const allCategories = await prisma.category.findMany();
  const getCatId = (name) => {
    const cat = allCategories.find(c => c.name === name);
    return cat ? cat.id : allCategories[0].id;
  };

  // Mark all old products unavailable
  await prisma.product.updateMany({
    data: { available: false }
  });

  // 3. Create Products
  const productsData = [
    { name: 'Porotta', cat: 'Bread', price: 15 },
    { name: 'Wheat Porotta', cat: 'Bread', price: 20 },
    { name: 'Nool Porotta', cat: 'Bread', price: 20 },
    { name: 'Egg Porotta', cat: 'Bread', price: 70 },
    { name: 'Coconut Grilled Porotta', cat: 'Bread', price: 60 },
    { name: 'Honey Porotta', cat: 'Bread', price: 50 },
    { name: 'Aalu Porotta', cat: 'Bread', price: 70 },
    { name: 'Garlic Porotta', cat: 'Bread', price: 70 },
    { name: 'Kuthu Porotta Beef', cat: 'Main Course', price: 170 },
    { name: 'Kuthu Porotta Chicken', cat: 'Main Course', price: 120 },
    { name: 'Kuthu Porotta Mix', cat: 'Main Course', price: 180 },
    { name: 'Murukabab Beef', cat: 'Starter', price: 160 },
    { name: 'Murukabab Chicken', cat: 'Starter', price: 150 },
    { name: 'Murukabab Mix', cat: 'Starter', price: 200 },
    { name: 'Kadak Porotta', cat: 'Bread', price: 20 },
    { name: 'Butter Toasted Porotta', cat: 'Bread', price: 40 },
    { name: 'Nice Dosa', cat: 'Breakfast', price: 15 },
    { name: 'Plain Dosa', cat: 'Breakfast', price: 40 },
    { name: 'Ghee Roast', cat: 'Breakfast', price: 60 },
    { name: 'Masala Dosa', cat: 'Breakfast', price: 80 },
    { name: 'Chilli Dosa', cat: 'Breakfast', price: 50 },
    { name: 'Uthappam', cat: 'Breakfast', price: 50 },
    { name: 'Egg Dosa', cat: 'Breakfast', price: 80 },
    { name: 'Mysore Masala Dosa', cat: 'Breakfast', price: 100 },
    { name: 'Podi Dosa', cat: 'Breakfast', price: 100 },
    { name: 'Podi Masala Dosa', cat: 'Breakfast', price: 100 },
    { name: 'Black Tea', cat: 'Beverages', price: 10 },
    { name: 'Lemon Tea', cat: 'Beverages', price: 20 },
    { name: 'Pepper Tea', cat: 'Beverages', price: 20 },
    { name: 'Ginger Tea', cat: 'Beverages', price: 20 },
    { name: 'Tea', cat: 'Beverages', price: 15 },
    { name: 'Cardamom Tea', cat: 'Beverages', price: 20 },
    { name: 'Saffron Tea', cat: 'Beverages', price: 30 },
    { name: 'Mint Tea', cat: 'Beverages', price: 20 },
    { name: 'Black Coffee', cat: 'Beverages', price: 10 },
    { name: 'Masala Coffee', cat: 'Beverages', price: 15 },
    { name: 'Coffee', cat: 'Beverages', price: 20 },
    { name: 'Bru Coffee', cat: 'Beverages', price: 25 },
    { name: 'Boost', cat: 'Beverages', price: 25 },
    { name: 'Horlicks', cat: 'Beverages', price: 25 },
    { name: 'Chukku Coffee', cat: 'Beverages', price: 20 },
    { name: 'Beef Curry', cat: 'Main Course', price: 100 },
    { name: 'Beef Fry', cat: 'Main Course', price: 100 },
    { name: 'Chicken Curry', cat: 'Main Course', price: 100 },
    { name: 'Chicken Fry', cat: 'Main Course', price: 100 },
    { name: 'Fish Curry', cat: 'Main Course', price: 80 },
    { name: 'Egg Curry', cat: 'Main Course', price: 35 },
    { name: 'Veg Curry', cat: 'Main Course', price: 35 },
    { name: 'Omlette', cat: 'Breakfast', price: 35 }
  ];

  for (const p of productsData) {
    const sku = p.name.replace(/\s+/g, '-').toUpperCase();
    await prisma.product.upsert({
      where: { sku: sku },
      update: {
        price: p.price,
        categoryId: getCatId(p.cat),
        available: true
      },
      create: {
        name: p.name,
        sku: sku,
        price: p.price,
        cost: p.price * 0.5,
        categoryId: getCatId(p.cat),
        trackStock: false,
        available: true
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
