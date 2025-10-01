import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCustomerById, updateCustomer, deleteCustomer } from '@/lib/customer-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Allow ADMIN and STORE_MANAGER to view customer details
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const customer = await getCustomerById(id);

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Allow ADMIN and STORE_MANAGER to update customer details
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const { firstName, lastName, email, phone, address, city, state, zipCode, customerType, isActive } = await request.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    const updatedCustomer = await updateCustomer(id, { 
      firstName, 
      lastName, 
      email, 
      phone, 
      address, 
      city, 
      state, 
      zipCode, 
      customerType, 
      isActive 
    });

    if (!updatedCustomer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Customer updated successfully',
      customer: updatedCustomer 
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Allow ADMIN and STORE_MANAGER to delete customers
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const deletedCustomer = await deleteCustomer(id);

    if (!deletedCustomer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Customer deleted successfully',
      customer: deletedCustomer 
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
