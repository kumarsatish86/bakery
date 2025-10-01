import { PrismaClient } from '@prisma/client';
import { databaseUrl } from './db-config';

// Initialize Prisma client with explicit DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

// ===== INVENTORY MANAGEMENT =====

export interface CreateInventoryData {
  productId: string;
  warehouseId?: string;
  quantity: number;
  reservedQty?: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface UpdateInventoryData {
  quantity?: number;
  reservedQty?: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface CreateWarehouseData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface InventoryMovement {
  productId: string;
  warehouseId?: string;
  quantity: number;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason: string;
  batchNumber?: string;
  expiryDate?: Date;
  location?: string;
}

// Warehouse Operations
export async function createWarehouse(warehouseData: CreateWarehouseData) {
  return prisma.warehouse.create({
    data: warehouseData,
  });
}

export async function getAllWarehouses() {
  return prisma.warehouse.findMany({
    where: { isActive: true },
    include: {
      inventory: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getWarehouseById(id: string) {
  return prisma.warehouse.findUnique({
    where: { id },
    include: {
      inventory: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function updateWarehouse(id: string, data: Partial<CreateWarehouseData>) {
  return prisma.warehouse.update({
    where: { id },
    data,
  });
}

export async function toggleWarehouseStatus(id: string) {
  const warehouse = await prisma.warehouse.findUnique({ where: { id } });
  if (!warehouse) return null;

  return prisma.warehouse.update({
    where: { id },
    data: { isActive: !warehouse.isActive },
  });
}

// Inventory Operations
export async function createInventoryRecord(inventoryData: CreateInventoryData) {
  return prisma.inventory.create({
    data: {
      productId: inventoryData.productId,
      warehouseId: inventoryData.warehouseId,
      quantity: inventoryData.quantity,
      reservedQty: inventoryData.reservedQty || 0,
      location: inventoryData.location,
      batchNumber: inventoryData.batchNumber,
      expiryDate: inventoryData.expiryDate,
    },
    include: {
      product: true,
      warehouse: true,
    },
  });
}

export async function getAllInventory() {
  return prisma.inventory.findMany({
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: {
      lastUpdated: 'desc',
    },
  });
}

export async function getInventoryByProduct(productId: string) {
  return prisma.inventory.findMany({
    where: { productId },
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: {
      lastUpdated: 'desc',
    },
  });
}

export async function getInventoryByWarehouse(warehouseId: string) {
  return prisma.inventory.findMany({
    where: { warehouseId },
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: {
      lastUpdated: 'desc',
    },
  });
}

export async function getInventoryById(id: string) {
  return prisma.inventory.findUnique({
    where: { id },
    include: {
      product: true,
      warehouse: true,
    },
  });
}

export async function updateInventory(id: string, data: UpdateInventoryData) {
  return prisma.inventory.update({
    where: { id },
    data: {
      ...data,
      lastUpdated: new Date(),
    },
    include: {
      product: true,
      warehouse: true,
    },
  });
}

export async function deleteInventory(id: string) {
  return prisma.inventory.delete({
    where: { id },
  });
}

// Inventory Movement Operations
export async function addInventory(movement: InventoryMovement) {
  const existingInventory = await prisma.inventory.findFirst({
    where: {
      productId: movement.productId,
      warehouseId: movement.warehouseId,
      batchNumber: movement.batchNumber,
    },
  });

  if (existingInventory) {
    // Update existing inventory
    return prisma.inventory.update({
      where: { id: existingInventory.id },
      data: {
        quantity: existingInventory.quantity + movement.quantity,
        lastUpdated: new Date(),
      },
      include: {
        product: true,
        warehouse: true,
      },
    });
  } else {
    // Create new inventory record
    return prisma.inventory.create({
      data: {
        productId: movement.productId,
        warehouseId: movement.warehouseId,
        quantity: movement.quantity,
        location: movement.location,
        batchNumber: movement.batchNumber,
        expiryDate: movement.expiryDate,
        lastUpdated: new Date(),
      },
      include: {
        product: true,
        warehouse: true,
      },
    });
  }
}

export async function removeInventory(movement: InventoryMovement) {
  const existingInventory = await prisma.inventory.findFirst({
    where: {
      productId: movement.productId,
      warehouseId: movement.warehouseId,
      batchNumber: movement.batchNumber,
    },
  });

  if (!existingInventory) {
    throw new Error('Inventory record not found');
  }

  if (existingInventory.quantity < movement.quantity) {
    throw new Error('Insufficient inventory quantity');
  }

  return prisma.inventory.update({
    where: { id: existingInventory.id },
    data: {
      quantity: existingInventory.quantity - movement.quantity,
      lastUpdated: new Date(),
    },
    include: {
      product: true,
      warehouse: true,
    },
  });
}

export async function adjustInventory(movement: InventoryMovement) {
  const existingInventory = await prisma.inventory.findFirst({
    where: {
      productId: movement.productId,
      warehouseId: movement.warehouseId,
      batchNumber: movement.batchNumber,
    },
  });

  if (!existingInventory) {
    throw new Error('Inventory record not found');
  }

  return prisma.inventory.update({
    where: { id: existingInventory.id },
    data: {
      quantity: movement.quantity,
      lastUpdated: new Date(),
    },
    include: {
      product: true,
      warehouse: true,
    },
  });
}

// Stock Management
export async function reserveInventory(productId: string, quantity: number, warehouseId?: string) {
  const inventoryRecords = await prisma.inventory.findMany({
    where: {
      productId,
      warehouseId,
      quantity: {
        gt: 0,
      },
    },
    orderBy: {
      expiryDate: 'asc', // FIFO - First In, First Out
    },
  });

  let remainingQty = quantity;
  const updates = [];

  for (const record of inventoryRecords) {
    if (remainingQty <= 0) break;

    const availableQty = record.quantity - record.reservedQty;
    const reserveQty = Math.min(remainingQty, availableQty);

    if (reserveQty > 0) {
      updates.push(
        prisma.inventory.update({
          where: { id: record.id },
          data: {
            reservedQty: record.reservedQty + reserveQty,
            lastUpdated: new Date(),
          },
        })
      );
      remainingQty -= reserveQty;
    }
  }

  if (remainingQty > 0) {
    throw new Error(`Insufficient inventory. Only ${quantity - remainingQty} units available for reservation.`);
  }

  return Promise.all(updates);
}

export async function releaseReservation(productId: string, quantity: number, warehouseId?: string) {
  const inventoryRecords = await prisma.inventory.findMany({
    where: {
      productId,
      warehouseId,
      reservedQty: {
        gt: 0,
      },
    },
    orderBy: {
      expiryDate: 'asc',
    },
  });

  let remainingQty = quantity;
  const updates = [];

  for (const record of inventoryRecords) {
    if (remainingQty <= 0) break;

    const releaseQty = Math.min(remainingQty, record.reservedQty);

    if (releaseQty > 0) {
      updates.push(
        prisma.inventory.update({
          where: { id: record.id },
          data: {
            reservedQty: record.reservedQty - releaseQty,
            lastUpdated: new Date(),
          },
        })
      );
      remainingQty -= releaseQty;
    }
  }

  return Promise.all(updates);
}

// Stock Reports
export async function getStockSummary() {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: true,
      warehouse: true,
    },
  });

  const summary = inventory.reduce((acc, item) => {
    const productId = item.productId;
    if (!acc[productId]) {
      acc[productId] = {
        product: item.product,
        totalQuantity: 0,
        totalReserved: 0,
        availableQuantity: 0,
        warehouses: [],
      };
    }

    acc[productId].totalQuantity += item.quantity;
    acc[productId].totalReserved += item.reservedQty;
    acc[productId].availableQuantity += (item.quantity - item.reservedQty);
    acc[productId].warehouses.push({
      warehouse: item.warehouse,
      quantity: item.quantity,
      reservedQty: item.reservedQty,
      availableQty: item.quantity - item.reservedQty,
      location: item.location,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
    });
    
    return acc;
  }, {} as Record<string, {
    product: { id: string; name: string; sku: string; category: string };
    totalQuantity: number;
    totalReserved: number;
    availableQuantity: number;
    warehouses: Array<{
      warehouse: { id: string; name: string } | null;
      quantity: number;
      reservedQty: number;
      availableQty: number;
      location: string | null;
      batchNumber: string | null;
      expiryDate: Date | null;
    }>;
  }>);

  return Object.values(summary);
}

export async function getLowStockAlerts() {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      inventory: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  const lowStockProducts = products.filter(product => {
    const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    return totalQuantity <= product.minStockLevel;
  });

  return lowStockProducts.map(product => ({
    product,
    currentStock: product.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
    minStockLevel: product.minStockLevel,
    shortage: product.minStockLevel - product.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
  }));
}

export async function getExpiringProducts(days: number = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  return prisma.inventory.findMany({
    where: {
      expiryDate: {
        lte: expiryDate,
        gte: new Date(),
      },
    },
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: {
      expiryDate: 'asc',
    },
  });
}
