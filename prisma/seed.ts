import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo users
  console.log('👥 Creating demo users...');
  
  const users = [
    {
      email: 'admin@bakery.com',
      password: await bcrypt.hash('admin123', 12),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as const,
    },
    {
      email: 'manager@bakery.com',
      password: await bcrypt.hash('manager123', 12),
      firstName: 'Store',
      lastName: 'Manager',
      role: 'STORE_MANAGER' as const,
    },
    {
      email: 'production@bakery.com',
      password: await bcrypt.hash('prod123', 12),
      firstName: 'Production',
      lastName: 'Team',
      role: 'PRODUCTION_TEAM' as const,
    },
    {
      email: 'cashier@bakery.com',
      password: await bcrypt.hash('cashier123', 12),
      firstName: 'Cashier',
      lastName: 'User',
      role: 'CASHIER' as const,
    },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: userData,
      });
      console.log(`✅ Created user: ${userData.email}`);
    } else {
      console.log(`⚠️  User already exists: ${userData.email}`);
    }
  }

  // Create demo customers
  console.log('🛒 Creating demo customers...');
  
  const customers = [
    {
      email: 'customer@bakery.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      customerType: 'INDIVIDUAL' as const,
    },
    {
      email: 'business@bakery.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567891',
      address: '456 Business Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      customerType: 'B2B' as const,
    },
    {
      email: 'community@bakery.com',
      firstName: 'Community',
      lastName: 'Center',
      phone: '+1234567892',
      address: '789 Community Blvd',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      customerType: 'COMMUNITY' as const,
    },
  ];

  for (const customerData of customers) {
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: customerData.email },
    });

    if (!existingCustomer) {
      await prisma.customer.create({
        data: customerData,
      });
      console.log(`✅ Created customer: ${customerData.email}`);
    } else {
      console.log(`⚠️  Customer already exists: ${customerData.email}`);
    }
  }

  // Create demo warehouse
  console.log('🏪 Creating demo warehouse...');
  
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'main-warehouse' },
    update: {},
    create: {
      id: 'main-warehouse',
      name: 'Main Warehouse',
      address: '100 Bakery Lane',
      city: 'New York',
      state: 'NY',
      zipCode: '10000',
    },
  });
  console.log(`✅ Created warehouse: ${warehouse.name}`);

  // Create demo suppliers
  console.log('🏭 Creating demo suppliers...');
  
  const suppliers = [
    {
      name: 'Fresh Ingredients Co.',
      contactPerson: 'Mike Johnson',
      email: 'mike@freshingredients.com',
      phone: '+1987654321',
      address: '200 Supplier Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10010',
      paymentTerms: 'Net 30',
    },
    {
      name: 'Bakery Equipment Ltd.',
      contactPerson: 'Sarah Wilson',
      email: 'sarah@bakeryequipment.com',
      phone: '+1987654322',
      address: '300 Equipment Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10011',
      paymentTerms: 'Net 15',
    },
  ];

  for (const supplierData of suppliers) {
    const existingSupplier = await prisma.supplier.findFirst({
      where: { name: supplierData.name },
    });

    if (!existingSupplier) {
      await prisma.supplier.create({
        data: supplierData,
      });
      console.log(`✅ Created supplier: ${supplierData.name}`);
    } else {
      console.log(`⚠️  Supplier already exists: ${supplierData.name}`);
    }
  }

  // Create demo products
  console.log('🍞 Creating demo products...');
  
  const products = [
    {
      sku: 'BREAD-001',
      name: 'Artisan Sourdough Bread',
      description: 'Traditional sourdough bread with crispy crust',
      barcode: '1234567890123',
      category: 'BREAD' as const,
      basePrice: 8.99,
      sellingPrice: 12.99,
      costPrice: 5.50,
      taxRate: 8.5,
      unitType: 'PIECE' as const,
      minStockLevel: 10,
      maxStockLevel: 50,
      weight: 0.8,
      shelfLife: 3,
    },
    {
      sku: 'PASTRY-001',
      name: 'Chocolate Croissant',
      description: 'Buttery croissant filled with premium chocolate',
      barcode: '1234567890124',
      category: 'PASTRY' as const,
      basePrice: 4.50,
      sellingPrice: 6.99,
      costPrice: 2.80,
      taxRate: 8.5,
      unitType: 'PIECE' as const,
      minStockLevel: 20,
      maxStockLevel: 100,
      weight: 0.12,
      shelfLife: 2,
    },
    {
      sku: 'CAKE-001',
      name: 'Red Velvet Cake',
      description: 'Classic red velvet cake with cream cheese frosting',
      barcode: '1234567890125',
      category: 'CAKE' as const,
      basePrice: 25.00,
      sellingPrice: 35.99,
      costPrice: 18.00,
      taxRate: 8.5,
      unitType: 'PIECE' as const,
      minStockLevel: 5,
      maxStockLevel: 20,
      weight: 1.5,
      shelfLife: 5,
    },
    {
      sku: 'COOKIE-001',
      name: 'Chocolate Chip Cookies',
      description: 'Soft and chewy chocolate chip cookies',
      barcode: '1234567890126',
      category: 'COOKIE' as const,
      basePrice: 2.50,
      sellingPrice: 4.99,
      costPrice: 1.50,
      taxRate: 8.5,
      unitType: 'PACK' as const,
      minStockLevel: 15,
      maxStockLevel: 75,
      weight: 0.2,
      shelfLife: 7,
    },
    {
      sku: 'BEVERAGE-001',
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      barcode: '1234567890127',
      category: 'BEVERAGE' as const,
      basePrice: 3.00,
      sellingPrice: 5.99,
      costPrice: 2.00,
      taxRate: 8.5,
      unitType: 'ML' as const,
      minStockLevel: 20,
      maxStockLevel: 100,
      weight: 0.5,
      shelfLife: 1,
    },
  ];

  for (const productData of products) {
    const existingProduct = await prisma.product.findUnique({
      where: { sku: productData.sku },
    });

    if (!existingProduct) {
      await prisma.product.create({
        data: productData,
      });
      console.log(`✅ Created product: ${productData.name}`);
    } else {
      console.log(`⚠️  Product already exists: ${productData.name}`);
    }
  }

  // Create initial inventory
  console.log('📦 Creating initial inventory...');
  
  const createdProducts = await prisma.product.findMany();
  const warehouseId = warehouse.id;

  for (const product of createdProducts) {
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        productId: product.id,
        warehouseId: warehouseId,
      },
    });

    if (!existingInventory) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: warehouseId,
          quantity: Math.floor(Math.random() * 50) + 20, // Random quantity between 20-70
          location: `Shelf-${Math.floor(Math.random() * 10) + 1}`,
          batchNumber: `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          expiryDate: new Date(Date.now() + (product.shelfLife || 7) * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`✅ Created inventory for: ${product.name}`);
    } else {
      console.log(`⚠️  Inventory already exists for: ${product.name}`);
    }
  }

  // Create demo recipes
  console.log('👨‍🍳 Creating demo recipes...');
  
  const recipes = [
    {
      name: 'Classic Sourdough Recipe',
      description: 'Traditional sourdough bread recipe',
      servings: 2,
      prepTime: 30,
      cookTime: 45,
      instructions: 'Mix ingredients, knead, proof, bake',
    },
    {
      name: 'Chocolate Croissant Recipe',
      description: 'Buttery croissant with chocolate filling',
      servings: 12,
      prepTime: 60,
      cookTime: 20,
      instructions: 'Prepare dough, add chocolate, fold, bake',
    },
  ];

  for (const recipeData of recipes) {
    const existingRecipe = await prisma.recipe.findFirst({
      where: { name: recipeData.name },
    });

    if (!existingRecipe) {
      await prisma.recipe.create({
        data: recipeData,
      });
      console.log(`✅ Created recipe: ${recipeData.name}`);
    } else {
      console.log(`⚠️  Recipe already exists: ${recipeData.name}`);
    }
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Demo Accounts Created:');
  console.log('👑 Admin: admin@bakery.com / admin123');
  console.log('👨‍💼 Store Manager: manager@bakery.com / manager123');
  console.log('👨‍🍳 Production Team: production@bakery.com / prod123');
  console.log('🚚 Delivery Team: delivery@bakery.com / delivery123');
  console.log('💰 Cashier: cashier@bakery.com / cashier123');
  console.log('🛒 Customer: customer@bakery.com (no password needed)');
  console.log('\n🏪 Sample data includes:');
  console.log('- 5 Products with inventory');
  console.log('- 3 Customers (Individual, B2B, Community)');
  console.log('- 2 Suppliers');
  console.log('- 1 Warehouse');
  console.log('- 2 Recipes');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });