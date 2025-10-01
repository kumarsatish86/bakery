import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { 
  getAllNotifications, 
  createNotification, 
  getNotificationSummary,
  CreateNotificationData 
} from '@/lib/notification-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let notifications = await getAllNotifications();

    // Apply filters
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    if (status) {
      notifications = notifications.filter(n => n.status === status);
    }
    if (search) {
      notifications = notifications.filter(n => 
        n.message.toLowerCase().includes(search.toLowerCase()) ||
        n.recipient.toLowerCase().includes(search.toLowerCase()) ||
        (n.subject && n.subject.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Pagination
    const total = notifications.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = notifications.slice(startIndex, endIndex);

    // Get summary stats
    const summary = await getNotificationSummary();

    return NextResponse.json({
      notifications: paginatedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalNotifications: summary.totalNotifications,
        sent: summary.byStatus.SENT?.count || 0,
        pending: summary.byStatus.PENDING?.count || 0,
        failed: summary.byStatus.FAILED?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, recipient, subject, message } = body;

    if (!type || !recipient || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notificationData: CreateNotificationData = {
      type,
      recipient,
      subject,
      message
    };

    const notification = await createNotification(notificationData);

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
