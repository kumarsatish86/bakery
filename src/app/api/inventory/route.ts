import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET - Fetch all inventory items
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const expiring = searchParams.get('expiring') === 'true';
    const days = parseInt(searchParams.get('days') || '7');
    const lowStock = searchParams.get('lowStock') === 'true';

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (expiring) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      where.expiryDate = {
        lte: expiryDate,
        gte: new Date(), // Not expired yet
      };
    }

    // Note: Low stock filtering will be handled in the frontend
    // since we need to compare with product.minStockLevel

    const inventory = await prisma.inventory.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, warehouseId, quantity, location, batchNumber, expiryDate, notes } = body;

    // Validate required fields
    if (!productId || !warehouseId || !quantity) {
      return NextResponse.json({ 
        message: 'Product ID, Warehouse ID, and Quantity are required' 
      }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      return NextResponse.json({ message: 'Warehouse not found' }, { status: 404 });
    }

    // Check if inventory already exists for this product in this warehouse
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        productId: productId,
        warehouseId: warehouseId,
      },
    });

    let inventoryItem;

    if (existingInventory) {
      // Update existing inventory
      inventoryItem = await prisma.inventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: existingInventory.quantity + quantity,
          location: location || existingInventory.location,
          batchNumber: batchNumber || existingInventory.batchNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : existingInventory.expiryDate,
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
      // Create new inventory item
      inventoryItem = await prisma.inventory.create({
        data: {
          productId: productId,
          warehouseId: warehouseId,
          quantity: quantity,
          reservedQty: 0,
          location: location || null,
          batchNumber: batchNumber || null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
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
    await prisma.inventoryMovement.create({
      data: {
        inventoryId: inventoryItem.id,
        movementType: 'STOCK_IN',
        quantity: quantity,
        reason: 'Stock Added',
        notes: notes || 'Stock added via admin panel',
        userId: decoded.id,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ 
      message: 'Inventory item created successfully',
      inventoryItem 
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}