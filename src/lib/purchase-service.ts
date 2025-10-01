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

// ===== SUPPLIER MANAGEMENT =====

export interface CreateSupplierData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  paymentTerms?: string;
}

export interface UpdateSupplierData {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  paymentTerms?: string;
}

// Supplier Operations
export async function createSupplier(supplierData: CreateSupplierData) {
  return prisma.supplier.create({
    data: supplierData,
  });
}

export async function getAllSuppliers() {
  return prisma.supplier.findMany({
    where: { isActive: true },
    include: {
      purchaseOrders: {
        orderBy: {
          orderDate: 'desc',
        },
        take: 5, // Last 5 orders
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getSupplierById(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          orderDate: 'desc',
        },
      },
    },
  });
}

export async function updateSupplier(id: string, data: UpdateSupplierData) {
  return prisma.supplier.update({
    where: { id },
    data,
  });
}

export async function toggleSupplierStatus(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) return null;

  return prisma.supplier.update({
    where: { id },
    data: { isActive: !supplier.isActive },
  });
}

export async function deleteSupplier(id: string) {
  return prisma.supplier.delete({
    where: { id },
  });
}

// ===== PURCHASE ORDER MANAGEMENT =====

export interface CreatePurchaseOrderData {
  supplierId: string;
  expectedDate?: Date;
  notes?: string;
  items: CreatePurchaseOrderItemData[];
}

export interface CreatePurchaseOrderItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdatePurchaseOrderData {
  supplierId?: string;
  status?: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  expectedDate?: Date;
  receivedDate?: Date;
  notes?: string;
}

// Purchase Order Operations
export async function createPurchaseOrder(poData: CreatePurchaseOrderData) {
  const poNumber = await generatePONumber();
  
  const totalAmount = poData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: poData.supplierId,
      expectedDate: poData.expectedDate,
      notes: poData.notes,
      totalAmount,
      items: {
        create: poData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function getAllPurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      orderDate: 'desc',
    },
  });
}

export async function getPurchaseOrderById(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function getPurchaseOrderByNumber(poNumber: string) {
  return prisma.purchaseOrder.findUnique({
    where: { poNumber },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function updatePurchaseOrder(id: string, data: UpdatePurchaseOrderData) {
  return prisma.purchaseOrder.update({
    where: { id },
    data,
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function updatePurchaseOrderStatus(id: string, status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED') {
  return prisma.purchaseOrder.update({
    where: { id },
    data: { 
      status,
      receivedDate: status === 'RECEIVED' ? new Date() : undefined,
    },
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function deletePurchaseOrder(id: string) {
  return prisma.purchaseOrder.delete({
    where: { id },
  });
}

// Purchase Order Item Operations
export async function addPurchaseOrderItem(poId: string, itemData: CreatePurchaseOrderItemData) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true },
  });

  if (!po) {
    throw new Error('Purchase order not found');
  }

  const newItem = await prisma.purchaseOrderItem.create({
    data: {
      purchaseOrderId: poId,
      productId: itemData.productId,
      quantity: itemData.quantity,
      unitPrice: itemData.unitPrice,
      totalPrice: itemData.quantity * itemData.unitPrice,
    },
    include: {
      product: true,
    },
  });

  // Update total amount
  const newTotalAmount = po.items.reduce((sum, item) => sum + Number(item.totalPrice), 0) + Number(newItem.totalPrice);
  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { totalAmount: newTotalAmount },
  });

  return newItem;
}

export async function updatePurchaseOrderItem(id: string, data: Partial<CreatePurchaseOrderItemData>) {
  const item = await prisma.purchaseOrderItem.findUnique({
    where: { id },
    include: { purchaseOrder: true },
  });

  if (!item) {
    throw new Error('Purchase order item not found');
  }

  const updatedItem = await prisma.purchaseOrderItem.update({
    where: { id },
    data: {
      ...data,
      totalPrice: data.quantity && data.unitPrice ? data.quantity * data.unitPrice : undefined,
    },
    include: {
      product: true,
    },
  });

  // Recalculate total amount
  const allItems = await prisma.purchaseOrderItem.findMany({
    where: { purchaseOrderId: item.purchaseOrderId },
  });
  const totalAmount = allItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  
  await prisma.purchaseOrder.update({
    where: { id: item.purchaseOrderId },
    data: { totalAmount },
  });

  return updatedItem;
}

export async function deletePurchaseOrderItem(id: string) {
  const item = await prisma.purchaseOrderItem.findUnique({
    where: { id },
    include: { purchaseOrder: true },
  });

  if (!item) {
    throw new Error('Purchase order item not found');
  }

  await prisma.purchaseOrderItem.delete({
    where: { id },
  });

  // Recalculate total amount
  const remainingItems = await prisma.purchaseOrderItem.findMany({
    where: { purchaseOrderId: item.purchaseOrderId },
  });
  const totalAmount = remainingItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  
  await prisma.purchaseOrder.update({
    where: { id: item.purchaseOrderId },
    data: { totalAmount },
  });

  return true;
}

// Purchase Order Receiving
export async function receivePurchaseOrderItem(itemId: string, receivedQty: number) {
  const item = await prisma.purchaseOrderItem.findUnique({
    where: { id: itemId },
    include: { purchaseOrder: true },
  });

  if (!item) {
    throw new Error('Purchase order item not found');
  }

  if (receivedQty > item.quantity) {
    throw new Error('Received quantity cannot exceed ordered quantity');
  }

  const updatedItem = await prisma.purchaseOrderItem.update({
    where: { id: itemId },
    data: { receivedQty },
    include: {
      product: true,
    },
  });

  // Check if all items are fully received
  const allItems = await prisma.purchaseOrderItem.findMany({
    where: { purchaseOrderId: item.purchaseOrderId },
  });

  const allReceived = allItems.every(item => item.receivedQty >= item.quantity);
  const partiallyReceived = allItems.some(item => item.receivedQty > 0);

  let newStatus = item.purchaseOrder.status;
  if (allReceived) {
    newStatus = 'RECEIVED';
  } else if (partiallyReceived) {
    newStatus = 'PARTIALLY_RECEIVED';
  }

  if (newStatus !== item.purchaseOrder.status) {
    await prisma.purchaseOrder.update({
      where: { id: item.purchaseOrderId },
      data: { 
        status: newStatus,
        receivedDate: newStatus === 'RECEIVED' ? new Date() : undefined,
      },
    });
  }

  return updatedItem;
}

// Utility Functions
async function generatePONumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `PO${year}${month}${day}`;
  
  const lastPO = await prisma.purchaseOrder.findFirst({
    where: {
      poNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      poNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastPO) {
    const lastSequence = parseInt(lastPO.poNumber.slice(-3));
    sequence = lastSequence + 1;
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

// Reports
export async function getPurchaseOrderSummary() {
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const summary = {
    totalOrders: orders.length,
    totalValue: orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    byStatus: {} as Record<string, { count: number; value: number }>,
    bySupplier: {} as Record<string, { count: number; value: number }>,
    recentOrders: orders.slice(0, 10),
  };

  orders.forEach(order => {
    // By status
    if (!summary.byStatus[order.status]) {
      summary.byStatus[order.status] = { count: 0, value: 0 };
    }
    summary.byStatus[order.status].count++;
    summary.byStatus[order.status].value += Number(order.totalAmount);

    // By supplier
    if (!summary.bySupplier[order.supplier.name]) {
      summary.bySupplier[order.supplier.name] = { count: 0, value: 0 };
    }
    summary.bySupplier[order.supplier.name].count++;
    summary.bySupplier[order.supplier.name].value += Number(order.totalAmount);
  });

  return summary;
}

export async function getSupplierStatistics() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      purchaseOrders: {
        include: {
          items: true,
        },
      },
    },
  });

  return suppliers.map(supplier => {
    const totalOrders = supplier.purchaseOrders.length;
    const totalValue = supplier.purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
    const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
    const lastOrderDate = supplier.purchaseOrders.length > 0 
      ? supplier.purchaseOrders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())[0].orderDate
      : null;

    return {
      supplier,
      totalOrders,
      totalValue,
      avgOrderValue,
      lastOrderDate,
    };
  });
}
