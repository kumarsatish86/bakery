import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET - Fetch all recipes
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructions: { contains: search, mode: 'insensitive' } },
      ];
    }

    const totalRecipes = await prisma.recipe.count({ where });
    const recipes = await prisma.recipe.findMany({
      where,
      include: {
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
      recipes,
      totalRecipes,
      currentPage: page,
      totalPages: Math.ceil(totalRecipes / limit),
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new recipe
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
    const { name, description, servings, prepTime, cookTime, instructions, items } = body;

    if (!name || !servings || prepTime === undefined || cookTime === undefined || !instructions) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        name,
        description: description || null,
        servings: Number(servings),
        prepTime: Number(prepTime),
        cookTime: Number(cookTime),
        instructions,
        items: {
          create: items?.map((item: { productId: string; quantity: number; unit: string }) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            unit: item.unit,
          })) || [],
        },
      },
      include: {
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
      message: 'Recipe created successfully',
      recipe 
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
