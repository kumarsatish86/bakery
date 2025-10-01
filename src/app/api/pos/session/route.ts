import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  startPOSSession,
  endPOSSession,
  getActiveSession,
  getSessionHistory,
} from '@/lib/pos-service';

// Start a new POS session
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
    const { startingCash = 0, notes } = body;

    const session = await startPOSSession({
      cashierId: user.id,
      startingCash,
      notes,
    });

    return NextResponse.json({
      message: 'Session started successfully',
      session,
    });
  } catch (error) {
    console.error('Error starting POS session:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get active session or session history
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'active' or 'history'
    const limit = parseInt(searchParams.get('limit') || '50');

    if (type === 'active') {
      const session = await getActiveSession(user.id);
      return NextResponse.json({
        message: 'Active session retrieved successfully',
        session,
      });
    } else {
      const sessions = await getSessionHistory(user.id, limit);
      return NextResponse.json({
        message: 'Session history retrieved successfully',
        sessions,
      });
    }
  } catch (error) {
    console.error('Error fetching POS session:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// End a POS session
export async function PUT(request: NextRequest) {
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
    const { sessionId, endingCash, notes } = body;

    if (!sessionId || endingCash === undefined) {
      return NextResponse.json(
        { message: 'Session ID and ending cash amount are required' },
        { status: 400 }
      );
    }

    const session = await endPOSSession(sessionId, endingCash, notes);

    return NextResponse.json({
      message: 'Session ended successfully',
      session,
    });
  } catch (error) {
    console.error('Error ending POS session:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
