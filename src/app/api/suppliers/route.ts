import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET - Fetch all suppliers
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

    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        contactPerson: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new supplier
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
    const { name, contactPerson, email, phone, address, city, state, zipCode, isActive } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        message: 'Supplier name is required' 
      }, { status: 400 });
    }

    if (!contactPerson) {
      return NextResponse.json({ 
        message: 'Contact person is required' 
      }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ 
        message: 'Email is required' 
      }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ 
        message: 'Phone number is required' 
      }, { status: 400 });
    }

    // Check if supplier with same email already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { email },
    });

    if (existingSupplier) {
      return NextResponse.json({ 
        message: 'A supplier with this email already exists' 
      }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ 
      message: 'Supplier created successfully',
      supplier 
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
