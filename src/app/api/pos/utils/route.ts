import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { syncOfflineOrders, checkDuplicateOrders } from '@/lib/pos-service';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'sync') {
      const result = await syncOfflineOrders();
      return NextResponse.json({
        message: 'Offline orders synced successfully',
        result,
      });
    } else if (action === 'check-duplicates') {
      const { searchParams } = new URL(request.url);
      const customerId = searchParams.get('customerId');
      const timeWindow = parseInt(searchParams.get('timeWindow') || '5');

      const duplicates = await checkDuplicateOrders(customerId || undefined, timeWindow);
      return NextResponse.json({
        message: 'Duplicate check completed',
        duplicates,
      });
    } else {
      return NextResponse.json(
        { message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POS utilities:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
