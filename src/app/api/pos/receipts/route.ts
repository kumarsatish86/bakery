import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateReceipt, getOrderReceipts } from '@/lib/pos-service';

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
    const { orderId, type = 'RECEIPT' } = body;

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Generate receipt content (simplified)
    const receiptContent = `
      <div class="receipt">
        <h2>Bakery Receipt</h2>
        <p>Order ID: ${orderId}</p>
        <p>Date: ${new Date().toLocaleString()}</p>
        <p>Cashier: ${user.email}</p>
        <hr>
        <p>Thank you for your purchase!</p>
      </div>
    `;

    const receipt = await generateReceipt({
      orderId,
      type,
      content: receiptContent,
    });

    return NextResponse.json({
      message: 'Receipt generated successfully',
      receipt,
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
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
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const receipts = await getOrderReceipts(orderId);

    return NextResponse.json({
      message: 'Receipts retrieved successfully',
      receipts,
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
