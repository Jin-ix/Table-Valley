const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@tablevalley.in';
  
  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { username: email }
  });

  if (existing) {
    console.log('Admin user already exists.');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      name: 'System Admin',
      username: email,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  console.log('Admin user seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
