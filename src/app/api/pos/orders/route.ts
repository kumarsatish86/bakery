import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  createPOSOrder,
  getPOSOrderById,
  getPOSOrderByNumber,
  updatePOSOrderStatus,
  addPOSOrderItem,
  updatePOSOrderItem,
  deletePOSOrderItem,
  addPayment,
  getOrderPayments,
  generateReceipt,
  getOrderReceipts,
  startPOSSession,
  endPOSSession,
  getActiveSession,
  getSessionHistory,
  syncOfflineOrders,
  checkDuplicateOrders,
  getPOSDailyReport,
} from '@/lib/pos-service';

// ===== POS ORDERS =====
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
    const { customerId, items, payments, notes, isOffline } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'Order must have at least one item' }, { status: 400 });
    }

    // Create the order
    const order = await createPOSOrder({
      customerId,
      cashierId: user.id,
      items,
      notes,
      isOffline,
    });

    // Add payments if provided
    if (payments && payments.length > 0) {
      for (const payment of payments) {
        await addPayment({
          orderId: order.id,
          method: payment.method,
          amount: payment.amount,
          reference: payment.reference,
        });
      }
    }

    // Update order status to completed if fully paid
    const updatedOrder = await getPOSOrderById(order.id);
    if (updatedOrder && Number(updatedOrder.paidAmount) >= Number(updatedOrder.totalAmount)) {
      await updatePOSOrderStatus(order.id, 'COMPLETED');
    }

    return NextResponse.json({
      message: 'Order created successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error creating POS order:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '50');

    // This would need to be implemented in the service layer
    // For now, return a placeholder response
    return NextResponse.json({
      message: 'POS orders retrieved successfully',
      orders: [],
      pagination: {
        limit,
        offset: 0,
        total: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching POS orders:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
