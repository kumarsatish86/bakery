import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// PUT - Update purchase order status
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
      return NextResponse.json({ 
        message: 'Status is required' 
      }, { status: 400 });
    }

    // Check if purchase order exists
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ message: 'Purchase order not found' }, { status: 404 });
    }

    // Update status
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
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
      message: 'Purchase order status updated successfully',
      purchaseOrder 
    });
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
