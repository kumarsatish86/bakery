import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// PUT - Update production status
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
    const { status, actualQty } = body;

    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    // Check if production exists
    const existingProduction = await prisma.production.findUnique({
      where: { id },
    });

    if (!existingProduction) {
      return NextResponse.json({ message: 'Production batch not found' }, { status: 404 });
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'PLANNED': ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'ON_HOLD', 'CANCELLED'],
      'ON_HOLD': ['IN_PROGRESS', 'CANCELLED'],
      'COMPLETED': [], // No transitions from completed
      'CANCELLED': [], // No transitions from cancelled
    };

    if (!validTransitions[existingProduction.status]?.includes(status)) {
      return NextResponse.json({ 
        message: `Cannot change status from ${existingProduction.status} to ${status}` 
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };

    // If completing production, set end date and actual quantity
    if (status === 'COMPLETED') {
      updateData.endDate = new Date();
      if (actualQty) {
        updateData.actualQty = Number(actualQty);
      }
    }

    const production = await prisma.production.update({
      where: { id },
      data: updateData,
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            servings: true,
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
      message: 'Production status updated successfully',
      production 
    });
  } catch (error) {
    console.error('Error updating production status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
