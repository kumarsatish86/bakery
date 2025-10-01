import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// PUT /api/deliveries/[id]/status - Update delivery status
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
      'SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      }, { status: 400 });
    }

    // Check if delivery exists
    const existingDelivery = await prisma.delivery.findUnique({ where: { id } });

    if (!existingDelivery) {
      return NextResponse.json({ message: 'Delivery not found' }, { status: 404 });
    }

    // Basic status transition validation
    if (
      (existingDelivery.status === 'DELIVERED' && status !== 'DELIVERED') ||
      (existingDelivery.status === 'RETURNED' && status !== 'RETURNED')
    ) {
      return NextResponse.json({
        message: `Cannot change status from ${existingDelivery.status} to ${status}`
      }, { status: 400 });
    }

    const updateData: { status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED'; actualDate?: Date } = { status: status as 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED' };

    // Set actual date when delivered
    if (status === 'DELIVERED' && existingDelivery.status !== 'DELIVERED') {
      updateData.actualDate = new Date();
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      message: 'Delivery status updated successfully',
      delivery 
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
