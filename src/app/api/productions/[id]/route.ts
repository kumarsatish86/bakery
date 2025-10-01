import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET - Fetch single production
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

    const production = await prisma.production.findUnique({
      where: { id },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            servings: true,
            prepTime: true,
            cookTime: true,
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

    if (!production) {
      return NextResponse.json({ message: 'Production batch not found' }, { status: 404 });
    }

    return NextResponse.json({ production });
  } catch (error) {
    console.error('Error fetching production:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update production
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
    const { recipeId, plannedQty, actualQty, startDate, endDate, notes, status, items } = body;

    // Validate required fields
    if (!recipeId) {
      return NextResponse.json({ 
        message: 'Recipe is required' 
      }, { status: 400 });
    }

    if (!plannedQty || plannedQty <= 0) {
      return NextResponse.json({ 
        message: 'Planned quantity must be greater than 0' 
      }, { status: 400 });
    }

    if (!startDate) {
      return NextResponse.json({ 
        message: 'Start date is required' 
      }, { status: 400 });
    }

    // Check if production exists
    const existingProduction = await prisma.production.findUnique({
      where: { id },
    });

    if (!existingProduction) {
      return NextResponse.json({ message: 'Production batch not found' }, { status: 404 });
    }

    const production = await prisma.production.update({
      where: { id },
      data: {
        recipeId,
        plannedQty: Number(plannedQty),
        actualQty: actualQty ? Number(actualQty) : null,
        plannedDate: new Date(startDate),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || null,
        status: status || existingProduction.status,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            servings: true,
            prepTime: true,
            cookTime: true,
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
      await prisma.productionItem.deleteMany({
        where: { productionId: id },
      });

      // Create new items
      await prisma.productionItem.createMany({
        data: items.map((item: { productId: string; plannedQty: number; actualQty?: number }) => ({
          productionId: id,
          productId: item.productId,
          plannedQty: Number(item.plannedQty),
          actualQty: item.actualQty ? Number(item.actualQty) : 0,
        })),
      });
    }

    return NextResponse.json({ 
      message: 'Production batch updated successfully',
      production 
    });
  } catch (error) {
    console.error('Error updating production:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete production
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

    // Check if production exists
    const existingProduction = await prisma.production.findUnique({
      where: { id },
    });

    if (!existingProduction) {
      return NextResponse.json({ message: 'Production batch not found' }, { status: 404 });
    }

    // Check if production is in progress
    if (existingProduction.status === 'IN_PROGRESS') {
      return NextResponse.json({ 
        message: 'Cannot delete production batch that is in progress' 
      }, { status: 400 });
    }

    // Delete production (items will be deleted automatically due to cascade)
    await prisma.production.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Production batch deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting production:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
