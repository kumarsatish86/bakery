import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/database';

// GET - Fetch single recipe
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
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

    if (!recipe) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update recipe
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, description, servings, prepTime, cookTime, instructions, items } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        message: 'Recipe name is required' 
      }, { status: 400 });
    }

    if (!servings || servings <= 0) {
      return NextResponse.json({ 
        message: 'Servings must be greater than 0' 
      }, { status: 400 });
    }

    if (prepTime === undefined || prepTime < 0) {
      return NextResponse.json({ 
        message: 'Prep time must be 0 or greater' 
      }, { status: 400 });
    }

    if (cookTime === undefined || cookTime < 0) {
      return NextResponse.json({ 
        message: 'Cook time must be 0 or greater' 
      }, { status: 400 });
    }

    if (!instructions) {
      return NextResponse.json({ 
        message: 'Instructions are required' 
      }, { status: 400 });
    }

    // Check if recipe exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        name,
        description: description || null,
        servings: Number(servings),
        prepTime: Number(prepTime),
        cookTime: Number(cookTime),
        instructions,
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

    // Handle items update: delete existing and create new ones
    if (items && items.length > 0) {
      // Delete existing items
      await prisma.recipeItem.deleteMany({
        where: { recipeId: id },
      });

      // Create new items
      await prisma.recipeItem.createMany({
        data: items.map((item: { productId: string; quantity: number; unit: string }) => ({
          recipeId: id,
          productId: item.productId,
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
      });
    }

    return NextResponse.json({ 
      message: 'Recipe updated successfully',
      recipe 
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete recipe
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Token required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if recipe exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    // Check if recipe is used in any productions
    const productions = await prisma.production.findFirst({
      where: { recipeId: id },
    });

    if (productions) {
      return NextResponse.json({ 
        message: 'Cannot delete recipe that is used in production batches' 
      }, { status: 400 });
    }

    // Delete recipe (items will be deleted automatically due to cascade)
    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Recipe deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
