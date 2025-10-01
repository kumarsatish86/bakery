import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllCustomers, createCustomer } from '@/lib/customer-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Allow ADMIN and STORE_MANAGER to view customers
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const customers = await getAllCustomers();

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Allow ADMIN and STORE_MANAGER to view customers
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const customerData = await request.json();
    const customer = await createCustomer(customerData);

    return NextResponse.json({ 
      message: 'Customer created successfully',
      customer 
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
