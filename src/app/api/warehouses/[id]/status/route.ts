import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// PUT - Toggle warehouse status
export async function PUT(
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
    const { isActive } = await request.json();

    const updatedWarehouse = await prisma.warehouse.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ 
      message: `Warehouse ${isActive ? 'activated' : 'deactivated'} successfully`,
      warehouse: updatedWarehouse 
    });
  } catch (error) {
    console.error('Error toggling warehouse status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
