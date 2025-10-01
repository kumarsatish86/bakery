import { PrismaClient, POSOrder, POSOrderItem, POSPayment, POSReceipt, POSSession, PaymentMethod, POSOrderStatus, ReceiptType } from '@prisma/client';

const prisma = new PrismaClient();

// ===== POS ORDER MANAGEMENT =====
export interface CreatePOSOrderData {
  customerId?: string;
  cashierId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
  }>;
  discountAmount?: number;
  notes?: string;
  isOffline?: boolean;
}

export async function createPOSOrder(data: CreatePOSOrderData): Promise<POSOrder> {
  const orderNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const subtotal = data.items.reduce((sum, item) => {
    const itemTotal = Number(item.unitPrice) * item.quantity;
    const discount = item.discount || 0;
    return sum + itemTotal - discount;
  }, 0);

  const taxAmount = subtotal * 0.08; // 8% tax
  const totalAmount = subtotal + taxAmount - (data.discountAmount || 0);

  const order = await prisma.pOSOrder.create({
    data: {
      orderNumber,
      customerId: data.customerId,
      cashierId: data.cashierId,
      subtotal,
      taxAmount,
      discountAmount: data.discountAmount || 0,
      totalAmount,
      notes: data.notes,
      isOffline: data.isOffline || false,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: Number(item.unitPrice) * item.quantity,
          discount: item.discount || 0,
          notes: item.notes,
        })),
      },
    },
    include: {
      customer: true,
      cashier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return order;
}

export async function getPOSOrderById(id: string): Promise<POSOrder | null> {
  return prisma.pOSOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      cashier: true,
      items: {
        include: {
          product: true,
        },
      },
      payments: true,
      receipts: true,
    },
  });
}

export async function getPOSOrderByNumber(orderNumber: string): Promise<POSOrder | null> {
  return prisma.pOSOrder.findUnique({
    where: { orderNumber },
    include: {
      customer: true,
      cashier: true,
      items: {
        include: {
          product: true,
        },
      },
      payments: true,
      receipts: true,
    },
  });
}

export async function updatePOSOrderStatus(id: string, status: POSOrderStatus): Promise<POSOrder> {
  return prisma.pOSOrder.update({
    where: { id },
    data: { status },
    include: {
      customer: true,
      cashier: true,
      items: {
        include: {
          product: true,
        },
      },
      payments: true,
    },
  });
}

export async function addPOSOrderItem(orderId: string, itemData: {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  notes?: string;
}): Promise<POSOrderItem> {
  const order = await prisma.pOSOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const newItem = await prisma.pOSOrderItem.create({
    data: {
      orderId,
      productId: itemData.productId,
      quantity: itemData.quantity,
      unitPrice: itemData.unitPrice,
      totalPrice: Number(itemData.unitPrice) * itemData.quantity,
      discount: itemData.discount || 0,
      notes: itemData.notes,
    },
    include: {
      product: true,
    },
  });

  // Update order totals
  const newSubtotal = order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0) + Number(newItem.totalPrice);
  const newTaxAmount = newSubtotal * 0.08;
  const newTotalAmount = newSubtotal + newTaxAmount - Number(order.discountAmount);

  await prisma.pOSOrder.update({
    where: { id: orderId },
    data: {
      subtotal: newSubtotal,
      taxAmount: newTaxAmount,
      totalAmount: newTotalAmount,
    },
  });

  return newItem;
}

export async function updatePOSOrderItem(itemId: string, itemData: {
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  notes?: string;
}): Promise<POSOrderItem> {
  const item = await prisma.pOSOrderItem.findUnique({
    where: { id: itemId },
    include: { order: true },
  });

  if (!item) {
    throw new Error('Order item not found');
  }

  const updatedItem = await prisma.pOSOrderItem.update({
    where: { id: itemId },
    data: {
      quantity: itemData.quantity || item.quantity,
      unitPrice: itemData.unitPrice || item.unitPrice,
      discount: itemData.discount !== undefined ? itemData.discount : item.discount,
      notes: itemData.notes || item.notes,
      totalPrice: Number(itemData.unitPrice || item.unitPrice) * (itemData.quantity || item.quantity),
    },
    include: {
      product: true,
    },
  });

  // Update order totals
  const order = await prisma.pOSOrder.findUnique({
    where: { id: item.orderId },
    include: { items: true },
  });

  if (order) {
    const newSubtotal = order.items.reduce((sum, orderItem) => {
      if (orderItem.id === itemId) {
        return sum + Number(updatedItem.totalPrice);
      }
      return sum + Number(orderItem.totalPrice);
    }, 0);

    const newTaxAmount = newSubtotal * 0.08;
    const newTotalAmount = newSubtotal + newTaxAmount - Number(order.discountAmount);

    await prisma.pOSOrder.update({
      where: { id: item.orderId },
      data: {
        subtotal: newSubtotal,
        taxAmount: newTaxAmount,
        totalAmount: newTotalAmount,
      },
    });
  }

  return updatedItem;
}

export async function deletePOSOrderItem(itemId: string): Promise<void> {
  const item = await prisma.pOSOrderItem.findUnique({
    where: { id: itemId },
    include: { order: true },
  });

  if (!item) {
    throw new Error('Order item not found');
  }

  await prisma.pOSOrderItem.delete({
    where: { id: itemId },
  });

  // Update order totals
  const order = await prisma.pOSOrder.findUnique({
    where: { id: item.orderId },
    include: { items: true },
  });

  if (order) {
    const newSubtotal = order.items.reduce((sum, orderItem) => {
      if (orderItem.id !== itemId) {
        return sum + Number(orderItem.totalPrice);
      }
      return sum;
    }, 0);

    const newTaxAmount = newSubtotal * 0.08;
    const newTotalAmount = newSubtotal + newTaxAmount - Number(order.discountAmount);

    await prisma.pOSOrder.update({
      where: { id: item.orderId },
      data: {
        subtotal: newSubtotal,
        taxAmount: newTaxAmount,
        totalAmount: newTotalAmount,
      },
    });
  }
}

// ===== PAYMENT MANAGEMENT =====
export interface CreatePaymentData {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  notes?: string;
}

export async function addPayment(data: CreatePaymentData): Promise<POSPayment> {
  const payment = await prisma.pOSPayment.create({
    data: {
      orderId: data.orderId,
      method: data.method,
      amount: data.amount,
      reference: data.reference,
      notes: data.notes,
      status: 'PAID',
      processedAt: new Date(),
    },
  });

  // Update order paid amount
  const order = await prisma.pOSOrder.findUnique({
    where: { id: data.orderId },
    include: { payments: true },
  });

  if (order) {
    const totalPaid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0) + Number(data.amount);
    const changeAmount = totalPaid - Number(order.totalAmount);

    await prisma.pOSOrder.update({
      where: { id: data.orderId },
      data: {
        paidAmount: totalPaid,
        changeAmount: changeAmount > 0 ? changeAmount : 0,
        status: totalPaid >= Number(order.totalAmount) ? 'COMPLETED' : 'IN_PROGRESS',
      },
    });
  }

  return payment;
}

export async function getOrderPayments(orderId: string): Promise<POSPayment[]> {
  return prisma.pOSPayment.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
}

// ===== RECEIPT MANAGEMENT =====
export interface CreateReceiptData {
  orderId: string;
  type: ReceiptType;
  content: string;
}

export async function generateReceipt(data: CreateReceiptData): Promise<POSReceipt> {
  const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return prisma.pOSReceipt.create({
    data: {
      orderId: data.orderId,
      receiptNumber,
      type: data.type,
      content: data.content,
    },
  });
}

export async function getOrderReceipts(orderId: string): Promise<POSReceipt[]> {
  return prisma.pOSReceipt.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
}

// ===== SESSION MANAGEMENT =====
export interface CreateSessionData {
  cashierId: string;
  startingCash: number;
  notes?: string;
}

export async function startPOSSession(data: CreateSessionData): Promise<POSSession> {
  // End any active session for this cashier
  await prisma.pOSSession.updateMany({
    where: {
      cashierId: data.cashierId,
      isActive: true,
    },
    data: {
      isActive: false,
      endTime: new Date(),
    },
  });

  return prisma.pOSSession.create({
    data: {
      cashierId: data.cashierId,
      startingCash: data.startingCash,
      notes: data.notes,
    },
    include: {
      cashier: true,
    },
  });
}

export async function endPOSSession(sessionId: string, endingCash: number, notes?: string): Promise<POSSession> {
  const session = await prisma.pOSSession.findUnique({
    where: { id: sessionId },
    include: {
      cashier: true,
    },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Calculate session totals
  const orders = await prisma.pOSOrder.findMany({
    where: {
      cashierId: session.cashierId,
      createdAt: {
        gte: session.startTime,
        lte: new Date(),
      },
    },
  });

  const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalTransactions = orders.length;

  return prisma.pOSSession.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      endTime: new Date(),
      endingCash,
      totalSales,
      totalTransactions,
      notes,
    },
    include: {
      cashier: true,
    },
  });
}

export async function getActiveSession(cashierId: string): Promise<POSSession | null> {
  return prisma.pOSSession.findFirst({
    where: {
      cashierId,
      isActive: true,
    },
    include: {
      cashier: true,
    },
  });
}

export async function getSessionHistory(cashierId?: string, limit: number = 50): Promise<POSSession[]> {
  return prisma.pOSSession.findMany({
    where: cashierId ? { cashierId } : {},
    include: {
      cashier: true,
    },
    orderBy: { startTime: 'desc' },
    take: limit,
  });
}

// ===== OFFLINE SYNC =====
export async function syncOfflineOrders(): Promise<{ synced: number; errors: string[] }> {
  const offlineOrders = await prisma.pOSOrder.findMany({
    where: {
      isOffline: true,
      syncedAt: null,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payments: true,
    },
  });

  let synced = 0;
  const errors: string[] = [];

  for (const order of offlineOrders) {
    try {
      // Update inventory for each item
      for (const item of order.items) {
        await prisma.inventory.updateMany({
          where: {
            productId: item.productId,
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Mark order as synced
      await prisma.pOSOrder.update({
        where: { id: order.id },
        data: {
          syncedAt: new Date(),
        },
      });

      synced++;
    } catch (error) {
      errors.push(`Failed to sync order ${order.orderNumber}: ${error}`);
    }
  }

  return { synced, errors };
}

// ===== DUPLICATE ORDER DETECTION =====
export async function checkDuplicateOrders(customerId?: string, timeWindowMinutes: number = 5): Promise<POSOrder[]> {
  const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const whereClause: {
    createdAt: { gte: Date };
    customerId?: string;
  } = {
    createdAt: {
      gte: timeWindow,
    },
  };

  if (customerId) {
    whereClause.customerId = customerId;
  }

  return prisma.pOSOrder.findMany({
    where: whereClause,
    include: {
      customer: true,
      cashier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ===== REPORTS =====
export async function getPOSDailyReport(date: Date): Promise<{
  totalSales: number;
  totalOrders: number;
  totalTransactions: number;
  paymentMethodBreakdown: Record<string, number>;
  topProducts: Array<{ product: {id: string; name: string; sku: string}; quantity: number; revenue: number }>;
}> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await prisma.pOSOrder.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'COMPLETED',
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payments: true,
    },
  });

  const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalOrders = orders.length;
  const totalTransactions = orders.reduce((sum, order) => sum + order.payments.length, 0);

  // Payment method breakdown
  const paymentMethodBreakdown: Record<string, number> = {};
  orders.forEach(order => {
    order.payments.forEach(payment => {
      const method = payment.method;
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + Number(payment.amount);
    });
  });

  // Top products
  const productSales: Record<string, { product: {id: string; name: string; sku: string}; quantity: number; revenue: number }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const productId = item.productId;
      if (!productSales[productId]) {
        productSales[productId] = {
          product: item.product,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[productId].quantity += item.quantity;
      productSales[productId].revenue += Number(item.totalPrice);
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    totalSales,
    totalOrders,
    totalTransactions,
    paymentMethodBreakdown,
    topProducts,
  };
}
