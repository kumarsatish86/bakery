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

// ===== ORDER MANAGEMENT =====

export interface CreateOrderData {
  customerId: string;
  deliveryDate?: Date;
  notes?: string;
  items: CreateOrderItemData[];
}

export interface CreateOrderItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface UpdateOrderData {
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_FOR_DELIVERY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  deliveryDate?: Date;
  notes?: string;
}

export interface CreateDeliveryData {
  orderId: string;
  customerId: string;
  scheduledDate: Date;
  deliveryAddress: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateDeliveryData {
  status?: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED';
  scheduledDate?: Date;
  actualDate?: Date;
  deliveryAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  notes?: string;
  driverName?: string;
  vehicleNumber?: string;
  trackingNumber?: string;
}

// Order Management
export async function createOrder(orderData: CreateOrderData) {
  const orderNumber = await generateOrderNumber();
  
  const totalAmount = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = totalAmount * 0.18; // Assuming 18% GST
  const finalAmount = totalAmount + taxAmount;

  return prisma.order.create({
    data: {
      orderNumber,
      customerId: orderData.customerId,
      deliveryDate: orderData.deliveryDate,
      notes: orderData.notes,
      totalAmount: finalAmount,
      taxAmount,
      items: {
        create: orderData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          notes: item.notes,
        })),
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
  });
}

export async function getAllOrders() {
  return prisma.order.findMany({
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
    orderBy: {
      orderDate: 'desc',
    },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
  });
}

export async function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
  });
}

export async function getOrdersByCustomer(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
    orderBy: {
      orderDate: 'desc',
    },
  });
}

export async function updateOrder(id: string, data: UpdateOrderData) {
  return prisma.order.update({
    where: { id },
    data,
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
  });
}

export async function updateOrderStatus(id: string, status: 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_FOR_DELIVERY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED') {
  return prisma.order.update({
    where: { id },
    data: { status },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
  });
}

export async function updatePaymentStatus(id: string, paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED') {
  return prisma.order.update({
    where: { id },
    data: { paymentStatus },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
  });
}

export async function cancelOrder(id: string) {
  return prisma.order.update({
    where: { id },
    data: { 
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED',
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      deliveries: true,
    },
  });
}

// Order Item Management
export async function addOrderItem(orderId: string, itemData: CreateOrderItemData) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const newItem = await prisma.orderItem.create({
    data: {
      orderId,
      productId: itemData.productId,
      quantity: itemData.quantity,
      unitPrice: itemData.unitPrice,
      totalPrice: itemData.quantity * itemData.unitPrice,
      notes: itemData.notes,
    },
    include: {
      product: true,
    },
  });

  // Update total amount
  const newSubtotal = order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0) + Number(newItem.totalPrice);
  const newTaxAmount = newSubtotal * 0.18;
  const newTotalAmount = newSubtotal + newTaxAmount;

  await prisma.order.update({
    where: { id: orderId },
    data: { 
      totalAmount: newTotalAmount,
      taxAmount: newTaxAmount,
    },
  });

  return newItem;
}

export async function updateOrderItem(id: string, data: Partial<CreateOrderItemData>) {
  const item = await prisma.orderItem.findUnique({
    where: { id },
    include: { order: true },
  });

  if (!item) {
    throw new Error('Order item not found');
  }

  const updatedItem = await prisma.orderItem.update({
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
  const allItems = await prisma.orderItem.findMany({
    where: { orderId: item.orderId },
  });
  const subtotal = allItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const taxAmount = subtotal * 0.18;
  const totalAmount = subtotal + taxAmount;
  
  await prisma.order.update({
    where: { id: item.orderId },
    data: { 
      totalAmount,
      taxAmount,
    },
  });

  return updatedItem;
}

export async function deleteOrderItem(id: string) {
  const item = await prisma.orderItem.findUnique({
    where: { id },
    include: { order: true },
  });

  if (!item) {
    throw new Error('Order item not found');
  }

  await prisma.orderItem.delete({
    where: { id },
  });

  // Recalculate total amount
  const remainingItems = await prisma.orderItem.findMany({
    where: { orderId: item.orderId },
  });
  const subtotal = remainingItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const taxAmount = subtotal * 0.18;
  const totalAmount = subtotal + taxAmount;
  
  await prisma.order.update({
    where: { id: item.orderId },
    data: { 
      totalAmount,
      taxAmount,
    },
  });

  return true;
}

// Delivery Management
export async function createDelivery(deliveryData: CreateDeliveryData) {
  const deliveryNumber = await generateDeliveryNumber();

  return prisma.delivery.create({
    data: {
      orderId: deliveryData.orderId,
      customerId: deliveryData.customerId,
      deliveryNumber,
      scheduledDate: deliveryData.scheduledDate,
      deliveryAddress: deliveryData.deliveryAddress,
      city: deliveryData.city,
      state: deliveryData.state,
      zipCode: deliveryData.zipCode,
      phone: deliveryData.phone,
      notes: deliveryData.notes,
    },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
    },
  });
}

export async function getAllDeliveries() {
  return prisma.delivery.findMany({
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
    },
    orderBy: {
      scheduledDate: 'desc',
    },
  });
}

export async function getDeliveryById(id: string) {
  return prisma.delivery.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
    },
  });
}

export async function getDeliveryByNumber(deliveryNumber: string) {
  return prisma.delivery.findUnique({
    where: { deliveryNumber },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
    },
  });
}

export async function getDeliveriesByDate(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.delivery.findMany({
    where: {
      scheduledDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
    },
    orderBy: {
      scheduledDate: 'asc',
    },
  });
}

export async function getDeliveriesByStatus(status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED') {
  return prisma.delivery.findMany({
    where: { status },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
    },
    orderBy: {
      scheduledDate: 'asc',
    },
  });
}

export async function updateDelivery(id: string, data: UpdateDeliveryData) {
  return prisma.delivery.update({
    where: { id },
    data: {
      ...data,
      actualDate: data.status === 'DELIVERED' && !data.actualDate ? new Date() : data.actualDate,
    },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
    },
  });
}

export async function updateDeliveryStatus(id: string, status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED') {
  return prisma.delivery.update({
    where: { id },
    data: { 
      status,
      actualDate: status === 'DELIVERED' ? new Date() : undefined,
    },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
    },
  });
}

export async function assignDeliveryDriver(id: string, driverName: string, vehicleNumber?: string) {
  return prisma.delivery.update({
    where: { id },
    data: { 
      driverName,
      vehicleNumber,
      status: 'IN_TRANSIT',
    },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
    },
  });
}

// Route Optimization
export async function getDeliveryRoutes(date: Date) {
  const deliveries = await getDeliveriesByDate(date);
  
  // Group deliveries by area/zip code for route optimization
  const routes = deliveries.reduce((acc, delivery) => {
    const key = delivery.zipCode || delivery.city || 'unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(delivery);
    return acc;
  }, {} as Record<string, Array<{
    id: string;
    orderId: string;
    customerId: string;
    deliveryNumber: string;
    status: string;
    scheduledDate: Date;
    actualDate: Date | null;
    deliveryAddress: string;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    phone: string | null;
    notes: string | null;
    driverName: string | null;
    vehicleNumber: string | null;
    trackingNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>>);

  // Sort deliveries within each route by scheduled time
  Object.keys(routes).forEach(key => {
    routes[key].sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  });

  return routes;
}

// Utility Functions
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `ORD${year}${month}${day}`;
  
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.slice(-3));
    sequence = lastSequence + 1;
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

async function generateDeliveryNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `DEL${year}${month}${day}`;
  
  const lastDelivery = await prisma.delivery.findFirst({
    where: {
      deliveryNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      deliveryNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastDelivery) {
    const lastSequence = parseInt(lastDelivery.deliveryNumber.slice(-3));
    sequence = lastSequence + 1;
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

// Reports
export async function getOrderSummary() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true,
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
    byPaymentStatus: {} as Record<string, { count: number; value: number }>,
    byCustomerType: {} as Record<string, { count: number; value: number }>,
    recentOrders: orders.slice(0, 10),
  };

  orders.forEach(order => {
    // By status
    if (!summary.byStatus[order.status]) {
      summary.byStatus[order.status] = { count: 0, value: 0 };
    }
    summary.byStatus[order.status].count++;
    summary.byStatus[order.status].value += Number(order.totalAmount);

    // By payment status
    if (!summary.byPaymentStatus[order.paymentStatus]) {
      summary.byPaymentStatus[order.paymentStatus] = { count: 0, value: 0 };
    }
    summary.byPaymentStatus[order.paymentStatus].count++;
    summary.byPaymentStatus[order.paymentStatus].value += Number(order.totalAmount);

    // By customer type
    if (!summary.byCustomerType[order.customer.customerType]) {
      summary.byCustomerType[order.customer.customerType] = { count: 0, value: 0 };
    }
    summary.byCustomerType[order.customer.customerType].count++;
    summary.byCustomerType[order.customer.customerType].value += Number(order.totalAmount);
  });

  return summary;
}

export async function getDeliverySummary() {
  const deliveries = await prisma.delivery.findMany({
    include: {
      order: {
        include: {
          customer: true,
        },
      },
    },
  });

  const summary = {
    totalDeliveries: deliveries.length,
    byStatus: {} as Record<string, { count: number }>,
    byDriver: {} as Record<string, { count: number }>,
    recentDeliveries: deliveries.slice(0, 10),
  };

  deliveries.forEach(delivery => {
    // By status
    if (!summary.byStatus[delivery.status]) {
      summary.byStatus[delivery.status] = { count: 0 };
    }
    summary.byStatus[delivery.status].count++;

    // By driver
    if (delivery.driverName) {
      if (!summary.byDriver[delivery.driverName]) {
        summary.byDriver[delivery.driverName] = { count: 0 };
      }
      summary.byDriver[delivery.driverName].count++;
    }
  });

  return summary;
}
