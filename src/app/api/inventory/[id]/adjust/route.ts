import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// POST - Adjust stock quantity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { adjustmentType, quantity, reason, notes } = await request.json();

    // Get current inventory item
    const currentItem = await prisma.inventory.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!currentItem) {
      return NextResponse.json({ message: 'Inventory item not found' }, { status: 404 });
    }

    let newQuantity = currentItem.quantity;

    // Calculate new quantity based on adjustment type
    switch (adjustmentType) {
      case 'add':
        newQuantity = currentItem.quantity + quantity;
        break;
      case 'remove':
        newQuantity = Math.max(0, currentItem.quantity - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        return NextResponse.json({ message: 'Invalid adjustment type' }, { status: 400 });
    }

    // Update inventory item
    const updatedItem = await prisma.inventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            minStockLevel: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create inventory movement record
    await prisma.inventoryMovement.create({
      data: {
        inventoryId: id,
        movementType: adjustmentType.toUpperCase(),
        quantity: quantity,
        reason: reason,
        notes: notes,
        userId: decoded.id,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ 
      message: 'Stock adjusted successfully',
      inventoryItem: updatedItem 
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
