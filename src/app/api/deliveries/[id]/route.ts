import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET /api/deliveries/[id] - Get delivery by ID
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

    const delivery = await prisma.delivery.findUnique({
      where: { id },
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

    if (!delivery) {
      return NextResponse.json({ message: 'Delivery not found' }, { status: 404 });
    }

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/deliveries/[id] - Update delivery
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
    const { 
      orderId, 
      scheduledDate, 
      deliveryAddress, 
      city, 
      state, 
      zipCode, 
      phone, 
      notes, 
      driverName, 
      vehicleNumber, 
      trackingNumber, 
      status 
    } = body;

    // Check if delivery exists
    const existingDelivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existingDelivery) {
      return NextResponse.json({ message: 'Delivery not found' }, { status: 404 });
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        orderId: orderId || existingDelivery.orderId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : existingDelivery.scheduledDate,
        deliveryAddress: deliveryAddress || existingDelivery.deliveryAddress,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        phone: phone || null,
        notes: notes || null,
        driverName: driverName || null,
        vehicleNumber: vehicleNumber || null,
        trackingNumber: trackingNumber || null,
        status: status || existingDelivery.status,
      },
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
      message: 'Delivery updated successfully',
      delivery 
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/deliveries/[id] - Delete delivery
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

    // Check if delivery exists
    const existingDelivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existingDelivery) {
      return NextResponse.json({ message: 'Delivery not found' }, { status: 404 });
    }

    // Check if delivery can be deleted (not delivered)
    if (existingDelivery.status === 'DELIVERED') {
      return NextResponse.json({ 
        message: 'Cannot delete delivered deliveries' 
      }, { status: 400 });
    }

    // Delete delivery
    await prisma.delivery.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Delivery deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
