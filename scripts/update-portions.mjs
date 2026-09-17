import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const itemsToUpdate = ['Beef Curry', 'Beef Fry', 'Chicken Curry', 'Chicken Fry'];
  
  for (const name of itemsToUpdate) {
    // Find the existing item
    const existing = await prisma.product.findFirst({
      where: { name }
    });

    if (existing) {
      console.log(`Updating ${name} to Half portion...`);
      // Update existing to Half
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: `${name} (Half)`,
          sku: `${existing.sku}-HALF`
        }
      });

      // Create Full version
      const fullName = `${name} (Full)`;
      const fullSku = `${existing.sku}-FULL`;
      
      const fullExists = await prisma.product.findFirst({
        where: { name: fullName }
      });

      if (!fullExists) {
        console.log(`Creating ${fullName}...`);
        await prisma.product.create({
          data: {
            name: fullName,
            sku: fullSku,
            price: 150,
            cost: 75,
            categoryId: existing.categoryId,
            trackStock: false,
            available: true
          }
        });
      }
    }
  }

  console.log('Portions updated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
