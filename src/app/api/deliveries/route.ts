import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET /api/deliveries - Get all deliveries with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const dateRange = searchParams.get('dateRange');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { deliveryNumber: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { driverName: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { order: { customer: { firstName: { contains: search, mode: 'insensitive' } } } },
        { order: { customer: { lastName: { contains: search, mode: 'insensitive' } } } },
        { order: { customer: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (city) {
      where.city = city;
    }

    if (dateRange) {
      const now = new Date();
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'this_week':
          startDate = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6)); // Saturday
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this_quarter':
          const currentMonth = now.getMonth();
          const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
          endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        // 'all_time' doesn't need date filters
      }

      if (startDate && endDate) {
        where.scheduledDate = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const totalDeliveries = await prisma.delivery.count({ where });
    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      deliveries,
      totalDeliveries,
      currentPage: page,
      totalPages: Math.ceil(totalDeliveries / limit),
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/deliveries - Create new delivery
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      orderId, 
      scheduledDate, 
      deliveryAddress, 
      city, 
      state, 
      zipCode, 
      phone, 
      notes, 
      driverName, 
      vehicleNumber, 
      trackingNumber 
    } = body;

    if (!orderId || !scheduledDate || !deliveryAddress) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Generate delivery number
    const deliveryNumber = `DEL-${Date.now()}`;

    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        customerId: order.customerId,
        deliveryNumber,
        scheduledDate: new Date(scheduledDate),
        deliveryAddress,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        phone: phone || null,
        notes: notes || null,
        driverName: driverName || null,
        vehicleNumber: vehicleNumber || null,
        trackingNumber: trackingNumber || null,
        status: 'SCHEDULED',
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      message: 'Delivery created successfully',
      delivery 
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
