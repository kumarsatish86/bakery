import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET - Fetch all productions
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
    const status = searchParams.get('status');
    const recipeId = searchParams.get('recipeId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (recipeId) {
      where.recipeId = recipeId;
    }
    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { recipe: { name: { contains: search, mode: 'insensitive' } } },
        { recipe: { description: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const totalProductions = await prisma.production.count({ where });
    const productions = await prisma.production.findMany({
      where,
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            servings: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
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
      productions,
      totalProductions,
      currentPage: page,
      totalPages: Math.ceil(totalProductions / limit),
    });
  } catch (error) {
    console.error('Error fetching productions:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new production
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
    const { recipeId, plannedQty, startDate, notes, status, items } = body;

    if (!recipeId || !plannedQty || !startDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Generate batch number
    const batchNumber = `BATCH-${Date.now()}`;

    const production = await prisma.production.create({
      data: {
        batchNumber,
        recipeId,
        plannedQty: Number(plannedQty),
        plannedDate: new Date(startDate),
        notes: notes || null,
        status: status || 'PLANNED',
        items: {
          create: items?.map((item: { productId: string; plannedQty: number }) => ({
            productId: item.productId,
            plannedQty: Number(item.plannedQty),
            actualQty: 0,
          })) || [],
        },
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            servings: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      message: 'Production batch created successfully',
      production 
    });
  } catch (error) {
    console.error('Error creating production:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
