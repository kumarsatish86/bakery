import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { markNotificationAsSent, markNotificationAsFailed } from '@/lib/notification-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    let notification;
    if (action === 'send') {
      notification = await markNotificationAsSent(id);
    } else if (action === 'retry') {
      // For retry, we'll mark as pending first, then send
      notification = await markNotificationAsSent(id);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error updating notification status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
