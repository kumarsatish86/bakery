import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// PUT /api/orders/[id]/status - Update order status
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
    const { status } = body;

    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    const validStatuses = [
      'PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DELIVERY', 
      'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({ where: { id } });

    if (!existingOrder) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Basic status transition validation
    if (
      (existingOrder.status === 'DELIVERED' && status !== 'DELIVERED') ||
      (existingOrder.status === 'CANCELLED' && status !== 'CANCELLED') ||
      (existingOrder.status === 'RETURNED' && status !== 'RETURNED')
    ) {
      return NextResponse.json({
        message: `Cannot change status from ${existingOrder.status} to ${status}`
      }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
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

    return NextResponse.json({ 
      message: 'Order status updated successfully',
      order 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
