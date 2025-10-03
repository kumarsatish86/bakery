import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { 
  updateCustomerAddress, 
  deleteCustomerAddress 
} from '@/lib/customer-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  try {
    const { id, addressId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Allow ADMIN and STORE_MANAGER to update customer addresses
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const addressData = await request.json();

    const updatedAddress = await updateCustomerAddress(addressId, addressData);

    if (!updatedAddress) {
      return NextResponse.json({ message: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Address updated successfully',
      address: updatedAddress 
    });
  } catch (error) {
    console.error('Error updating customer address:', error);
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
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  try {
    const { id, addressId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Allow ADMIN and STORE_MANAGER to delete customer addresses
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const deletedAddress = await deleteCustomerAddress(addressId);

    if (!deletedAddress) {
      return NextResponse.json({ message: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Address deleted successfully',
      address: deletedAddress 
    });
  } catch (error) {
    console.error('Error deleting customer address:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
