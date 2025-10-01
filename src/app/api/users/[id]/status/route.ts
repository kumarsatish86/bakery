import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { toggleUserStatus } from '@/lib/user-service';

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

    // Allow ADMIN and STORE_MANAGER to toggle user status
    if (!['ADMIN', 'STORE_MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ 
        message: 'Unauthorized - Admin or Store Manager role required',
        userRole: decoded.role 
      }, { status: 403 });
    }

    const updatedUser = await toggleUserStatus(id);

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'User status updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
