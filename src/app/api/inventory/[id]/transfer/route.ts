import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// POST - Transfer stock between warehouses
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
    const { fromWarehouseId, toWarehouseId, quantity, reason, notes } = await request.json();

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

    // Check if there's enough stock to transfer
    const availableQuantity = currentItem.quantity - currentItem.reservedQty;
    if (availableQuantity < quantity) {
      return NextResponse.json({ 
        message: `Insufficient stock. Available: ${availableQuantity}, Requested: ${quantity}` 
      }, { status: 400 });
    }

    // Check if destination warehouse exists
    const destinationWarehouse = await prisma.warehouse.findUnique({
      where: { id: toWarehouseId },
    });

    if (!destinationWarehouse) {
      return NextResponse.json({ message: 'Destination warehouse not found' }, { status: 404 });
    }

    // Check if inventory already exists in destination warehouse
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        productId: currentItem.productId,
        warehouseId: toWarehouseId,
      },
    });

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Reduce quantity from source inventory
      const updatedSourceItem = await tx.inventory.update({
        where: { id },
        data: {
          quantity: currentItem.quantity - quantity,
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

      // Add or update inventory in destination warehouse
      let destinationItem;
      if (existingInventory) {
        destinationItem = await tx.inventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: existingInventory.quantity + quantity,
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
      } else {
        destinationItem = await tx.inventory.create({
          data: {
            productId: currentItem.productId,
            warehouseId: toWarehouseId,
            quantity: quantity,
            reservedQty: 0,
            location: null,
            batchNumber: currentItem.batchNumber,
            expiryDate: currentItem.expiryDate,
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
      }

      // Create inventory movement record
      await tx.inventoryMovement.create({
        data: {
          inventoryId: id,
          movementType: 'TRANSFER_OUT',
          quantity: quantity,
          reason: reason,
          notes: notes,
          userId: decoded.id,
          timestamp: new Date(),
        },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryId: destinationItem.id,
          movementType: 'TRANSFER_IN',
          quantity: quantity,
          reason: reason,
          notes: notes,
          userId: decoded.id,
          timestamp: new Date(),
        },
      });

      return { updatedSourceItem, destinationItem };
    });

    return NextResponse.json({ 
      message: 'Stock transferred successfully',
      sourceItem: result.updatedSourceItem,
      destinationItem: result.destinationItem
    });
  } catch (error) {
    console.error('Error transferring stock:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
