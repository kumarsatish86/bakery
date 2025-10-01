import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET - Fetch all warehouses
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

    const warehouses = await prisma.warehouse.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        capacity: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new warehouse
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
    const { name, location, address, city, state, zipCode, capacity, isActive } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        message: 'Warehouse name is required' 
      }, { status: 400 });
    }

    // Check if warehouse with same name already exists
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: { name },
    });

    if (existingWarehouse) {
      return NextResponse.json({ 
        message: 'A warehouse with this name already exists' 
      }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location: location || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        capacity: capacity || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ 
      message: 'Warehouse created successfully',
      warehouse 
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
