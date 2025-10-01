import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { toggleProductStatus } from '@/lib/product-service';

// PUT /api/products/[id]/status - Toggle product status
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

    // Check if user has admin or store manager privileges
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const updatedProduct = await toggleProductStatus(id);

    if (!updatedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Product status updated successfully',
      product: updatedProduct 
    });
  } catch (error) {
    console.error('Error toggling product status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
