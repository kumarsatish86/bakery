import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { 
  getCustomerAddresses, 
  createCustomerAddress 
} from '@/lib/customer-service';

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

    // Allow ADMIN and STORE_MANAGER to view customer addresses
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const addresses = await getCustomerAddresses(id);

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Allow ADMIN and STORE_MANAGER to create customer addresses
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const addressData = await request.json();

    if (!addressData.address || !addressData.city || !addressData.state || !addressData.zipCode) {
      return NextResponse.json(
        { message: 'Address, city, state, and zip code are required' },
        { status: 400 }
      );
    }

    const newAddress = await createCustomerAddress(id, addressData);

    return NextResponse.json({ 
      message: 'Address created successfully',
      address: newAddress 
    });
  } catch (error) {
    console.error('Error creating customer address:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
