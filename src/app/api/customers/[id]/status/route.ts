import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { toggleCustomerStatus } from '@/lib/customer-service';

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

    // Check if user has admin privileges
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const updatedCustomer = await toggleCustomerStatus(id);

    if (!updatedCustomer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Customer status updated successfully',
      customer: updatedCustomer 
    });
  } catch (error) {
    console.error('Error toggling customer status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
