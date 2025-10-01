import { prisma } from './database';

// ===== COMMUNICATION & NOTIFICATIONS =====

export interface CreateNotificationData {
  type: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH';
  recipient: string;
  subject?: string;
  message: string;
}

export interface UpdateNotificationData {
  type?: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH';
  recipient?: string;
  subject?: string;
  message?: string;
  status?: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH';
  subject?: string;
  message: string;
  variables: string[]; // Template variables like {customerName}, {orderNumber}
}

// Notification Management
export async function createNotification(notificationData: CreateNotificationData) {
  return prisma.notification.create({
    data: {
      type: notificationData.type,
      recipient: notificationData.recipient,
      subject: notificationData.subject,
      message: notificationData.message,
      status: 'PENDING',
    },
  });
}

export async function getAllNotifications() {
  return prisma.notification.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getNotificationById(id: string) {
  return prisma.notification.findUnique({
    where: { id },
  });
}

export async function getNotificationsByRecipient(recipient: string) {
  return prisma.notification.findMany({
    where: { recipient },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getNotificationsByType(type: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH') {
  return prisma.notification.findMany({
    where: { type },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getNotificationsByStatus(status: 'PENDING' | 'SENT' | 'FAILED') {
  return prisma.notification.findMany({
    where: { status },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

export async function updateNotification(id: string, data: UpdateNotificationData) {
  return prisma.notification.update({
    where: { id },
    data,
  });
}

export async function markNotificationAsSent(id: string) {
  return prisma.notification.update({
    where: { id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
  });
}

export async function markNotificationAsFailed(id: string) {
  return prisma.notification.update({
    where: { id },
    data: {
      status: 'FAILED',
    },
  });
}

// Bulk Notification Operations
export async function createBulkNotifications(notifications: CreateNotificationData[]) {
  const results = [];
  for (const notification of notifications) {
    try {
      const result = await createNotification(notification);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: error, data: notification });
    }
  }
  return results;
}

export async function sendBulkNotifications(notificationIds: string[]) {
  const results = [];
  for (const id of notificationIds) {
    try {
      const result = await markNotificationAsSent(id);
      results.push({ success: true, data: result });
    } catch (error) {
      await markNotificationAsFailed(id);
      results.push({ success: false, error: error, id });
    }
  }
  return results;
}

// Template-based Notifications
const notificationTemplates: NotificationTemplate[] = [
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    type: 'SMS',
    message: 'Hi {customerName}, your order {orderNumber} has been confirmed. Total: ₹{totalAmount}. Delivery scheduled for {deliveryDate}. Thank you!',
    variables: ['customerName', 'orderNumber', 'totalAmount', 'deliveryDate'],
  },
  {
    id: 'order_confirmation_email',
    name: 'Order Confirmation Email',
    type: 'EMAIL',
    subject: 'Order Confirmation - {orderNumber}',
    message: 'Dear {customerName},\n\nYour order {orderNumber} has been confirmed.\n\nOrder Details:\nTotal Amount: ₹{totalAmount}\nDelivery Date: {deliveryDate}\n\nThank you for choosing us!\n\nBest regards,\nBakery Team',
    variables: ['customerName', 'orderNumber', 'totalAmount', 'deliveryDate'],
  },
  {
    id: 'delivery_ready',
    name: 'Delivery Ready',
    type: 'SMS',
    message: 'Hi {customerName}, your order {orderNumber} is ready for delivery. Driver: {driverName}, Vehicle: {vehicleNumber}. Expected delivery time: {expectedTime}.',
    variables: ['customerName', 'orderNumber', 'driverName', 'vehicleNumber', 'expectedTime'],
  },
  {
    id: 'delivery_out',
    name: 'Out for Delivery',
    type: 'SMS',
    message: 'Hi {customerName}, your order {orderNumber} is out for delivery. Track your order: {trackingLink}.',
    variables: ['customerName', 'orderNumber', 'trackingLink'],
  },
  {
    id: 'delivery_delivered',
    name: 'Delivery Completed',
    type: 'SMS',
    message: 'Hi {customerName}, your order {orderNumber} has been delivered successfully. Thank you for your business!',
    variables: ['customerName', 'orderNumber'],
  },
  {
    id: 'delivery_failed',
    name: 'Delivery Failed',
    type: 'SMS',
    message: 'Hi {customerName}, we were unable to deliver your order {orderNumber}. Reason: {reason}. Please contact us to reschedule.',
    variables: ['customerName', 'orderNumber', 'reason'],
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    type: 'SMS',
    message: 'Hi {customerName}, payment for order {orderNumber} is pending. Amount: ₹{amount}. Please complete payment to confirm your order.',
    variables: ['customerName', 'orderNumber', 'amount'],
  },
  {
    id: 'promotional_offer',
    name: 'Promotional Offer',
    type: 'SMS',
    message: 'Hi {customerName}, special offer just for you! {offerDescription}. Valid until {validUntil}. Use code: {promoCode}',
    variables: ['customerName', 'offerDescription', 'validUntil', 'promoCode'],
  },
];

export function getNotificationTemplate(templateId: string): NotificationTemplate | undefined {
  return notificationTemplates.find(template => template.id === templateId);
}

export function getAllNotificationTemplates(): NotificationTemplate[] {
  return notificationTemplates;
}

export function processTemplate(template: NotificationTemplate, variables: Record<string, string>): { subject?: string; message: string } {
  let message = template.message;
  let subject = template.subject;

  // Replace variables in message
  template.variables.forEach(variable => {
    const value = variables[variable] || `{${variable}}`;
    message = message.replace(new RegExp(`{${variable}}`, 'g'), value);
  });

  // Replace variables in subject
  if (subject) {
    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      subject = subject!.replace(new RegExp(`{${variable}}`, 'g'), value);
    });
  }

  return { subject, message };
}

// Automated Notification Triggers
export async function sendOrderConfirmation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const template = getNotificationTemplate('order_confirmation');
  if (!template) {
    throw new Error('Order confirmation template not found');
  }

  const variables = {
    customerName: order.customer.firstName,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount.toString(),
    deliveryDate: order.deliveryDate ? order.deliveryDate.toLocaleDateString() : 'TBD',
  };

  const { message } = processTemplate(template, variables);

  return createNotification({
    type: template.type,
    recipient: order.customer.phone || order.customer.email,
    message,
  });
}

export async function sendDeliveryReady(deliveryId: string, driverName: string, vehicleNumber?: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      customer: true,
      order: true,
    },
  });

  if (!delivery) {
    throw new Error('Delivery not found');
  }

  const template = getNotificationTemplate('delivery_ready');
  if (!template) {
    throw new Error('Delivery ready template not found');
  }

  const variables = {
    customerName: delivery.customer.firstName,
    orderNumber: delivery.order.orderNumber,
    driverName,
    vehicleNumber: vehicleNumber || 'N/A',
    expectedTime: delivery.scheduledDate.toLocaleTimeString(),
  };

  const { message } = processTemplate(template, variables);

  return createNotification({
    type: template.type,
    recipient: delivery.customer.phone || delivery.customer.email,
    message,
  });
}

export async function sendOutForDelivery(deliveryId: string, trackingLink?: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      customer: true,
      order: true,
    },
  });

  if (!delivery) {
    throw new Error('Delivery not found');
  }

  const template = getNotificationTemplate('delivery_out');
  if (!template) {
    throw new Error('Out for delivery template not found');
  }

  const variables = {
    customerName: delivery.customer.firstName,
    orderNumber: delivery.order.orderNumber,
    trackingLink: trackingLink || 'Contact us for updates',
  };

  const { message } = processTemplate(template, variables);

  return createNotification({
    type: template.type,
    recipient: delivery.customer.phone || delivery.customer.email,
    message,
  });
}

export async function sendDeliveryCompleted(deliveryId: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      customer: true,
      order: true,
    },
  });

  if (!delivery) {
    throw new Error('Delivery not found');
  }

  const template = getNotificationTemplate('delivery_delivered');
  if (!template) {
    throw new Error('Delivery completed template not found');
  }

  const variables = {
    customerName: delivery.customer.firstName,
    orderNumber: delivery.order.orderNumber,
  };

  const { message } = processTemplate(template, variables);

  return createNotification({
    type: template.type,
    recipient: delivery.customer.phone || delivery.customer.email,
    message,
  });
}

export async function sendDeliveryFailed(deliveryId: string, reason: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      customer: true,
      order: true,
    },
  });

  if (!delivery) {
    throw new Error('Delivery not found');
  }

  const template = getNotificationTemplate('delivery_failed');
  if (!template) {
    throw new Error('Delivery failed template not found');
  }

  const variables = {
    customerName: delivery.customer.firstName,
    orderNumber: delivery.order.orderNumber,
    reason,
  };

  const { message } = processTemplate(template, variables);

  return createNotification({
    type: template.type,
    recipient: delivery.customer.phone || delivery.customer.email,
    message,
  });
}

export async function sendPaymentReminder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const template = getNotificationTemplate('payment_reminder');
  if (!template) {
    throw new Error('Payment reminder template not found');
  }

  const variables = {
    customerName: order.customer.firstName,
    orderNumber: order.orderNumber,
    amount: order.totalAmount.toString(),
  };

  const { message } = processTemplate(template, variables);

  return createNotification({
    type: template.type,
    recipient: order.customer.phone || order.customer.email,
    message,
  });
}

export async function sendPromotionalOffer(customerIds: string[], offerDescription: string, validUntil: string, promoCode: string) {
  const customers = await prisma.customer.findMany({
    where: {
      id: { in: customerIds },
      isActive: true,
    },
  });

  const notifications = customers.map(customer => {
    const template = getNotificationTemplate('promotional_offer');
    if (!template) {
      throw new Error('Promotional offer template not found');
    }

    const variables = {
      customerName: customer.firstName,
      offerDescription,
      validUntil,
      promoCode,
    };

    const { message } = processTemplate(template, variables);

    return {
      type: template.type,
      recipient: customer.phone || customer.email,
      message,
    };
  });

  return createBulkNotifications(notifications);
}

// Notification Processing Queue
export async function processPendingNotifications() {
  const pendingNotifications = await getNotificationsByStatus('PENDING');
  const results = [];

  for (const notification of pendingNotifications) {
    try {
      // Here you would integrate with actual SMS/Email/WhatsApp services
      // For now, we'll simulate sending
      await simulateNotificationSending(notification);
      
      await markNotificationAsSent(notification.id);
      results.push({ success: true, id: notification.id });
    } catch (error) {
      await markNotificationAsFailed(notification.id);
      results.push({ success: false, id: notification.id, error });
    }
  }

  return results;
}

async function simulateNotificationSending(notification: { id: string; type: string; recipient: string; message: string }) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate occasional failures
  if (Math.random() < 0.1) { // 10% failure rate
    throw new Error('Simulated sending failure');
  }
}

// Reports
export async function getNotificationSummary() {
  const notifications = await prisma.notification.findMany();

  const summary = {
    totalNotifications: notifications.length,
    byType: {} as Record<string, { count: number }>,
    byStatus: {} as Record<string, { count: number }>,
    recentNotifications: notifications.slice(0, 10),
  };

  notifications.forEach(notification => {
    // By type
    if (!summary.byType[notification.type]) {
      summary.byType[notification.type] = { count: 0 };
    }
    summary.byType[notification.type].count++;

    // By status
    if (!summary.byStatus[notification.status]) {
      summary.byStatus[notification.status] = { count: 0 };
    }
    summary.byStatus[notification.status].count++;
  });

  return summary;
}

export async function getNotificationStats(days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const notifications = await prisma.notification.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
  });

  const stats = {
    totalSent: notifications.filter(n => n.status === 'SENT').length,
    totalFailed: notifications.filter(n => n.status === 'FAILED').length,
    totalPending: notifications.filter(n => n.status === 'PENDING').length,
    successRate: 0,
    byDay: {} as Record<string, { sent: number; failed: number; pending: number }>,
  };

  // Calculate success rate
  const totalProcessed = stats.totalSent + stats.totalFailed;
  stats.successRate = totalProcessed > 0 ? (stats.totalSent / totalProcessed) * 100 : 0;

  // Group by day
  notifications.forEach(notification => {
    const day = notification.createdAt.toISOString().split('T')[0];
    if (!stats.byDay[day]) {
      stats.byDay[day] = { sent: 0, failed: 0, pending: 0 };
    }
    const statusKey = notification.status.toLowerCase() as 'sent' | 'failed' | 'pending';
    stats.byDay[day][statusKey]++;
  });

  return stats;
}
