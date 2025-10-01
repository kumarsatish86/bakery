import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET /api/orders/[id] - Get order by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            customerType: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        deliveries: {
          select: {
            id: true,
            status: true,
            scheduledDate: true,
            driverName: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/orders/[id] - Update order
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { customerId, deliveryDate, notes, status, paymentStatus, subtotal, taxAmount, totalAmount, items } = body;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        customerId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        notes: notes || null,
        status: status || existingOrder.status,
        paymentStatus: paymentStatus || existingOrder.paymentStatus,
        taxAmount: taxAmount ? Number(taxAmount) : existingOrder.taxAmount,
        totalAmount: totalAmount ? Number(totalAmount) : existingOrder.totalAmount,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            customerType: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    // Handle items update: delete existing and create new ones
    if (items && items.length > 0) {
      // Delete existing items
      await prisma.orderItem.deleteMany({
        where: { orderId: id },
      });

      // Create new items
      await prisma.orderItem.createMany({
        data: items.map((item: { productId: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
          orderId: id,
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      });
    }

    return NextResponse.json({ 
      message: 'Order updated successfully',
      order 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/orders/[id] - Delete order
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Check if order can be deleted (not delivered or cancelled)
    if (existingOrder.status === 'DELIVERED' || existingOrder.status === 'CANCELLED') {
      return NextResponse.json({ 
        message: 'Cannot delete delivered or cancelled orders' 
      }, { status: 400 });
    }

    // Delete order (items will be deleted automatically due to cascade)
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Order deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}