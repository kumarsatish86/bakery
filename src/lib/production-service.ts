import { PrismaClient } from '@prisma/client';
import { databaseUrl } from './db-config';

// Initialize Prisma client with explicit DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

// ===== PRODUCTION MANAGEMENT =====

export interface CreateRecipeData {
  name: string;
  description?: string;
  servings: number;
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  instructions?: string;
  items: CreateRecipeItemData[];
}

export interface CreateRecipeItemData {
  productId: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface UpdateRecipeData {
  name?: string;
  description?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  instructions?: string;
}

export interface CreateProductionData {
  recipeId: string;
  plannedQty: number;
  plannedDate: Date;
  notes?: string;
}

export interface UpdateProductionData {
  plannedQty?: number;
  actualQty?: number;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  plannedDate?: Date;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

// Recipe Management
export async function createRecipe(recipeData: CreateRecipeData) {
  return prisma.recipe.create({
    data: {
      name: recipeData.name,
      description: recipeData.description,
      servings: recipeData.servings,
      prepTime: recipeData.prepTime,
      cookTime: recipeData.cookTime,
      instructions: recipeData.instructions,
      items: {
        create: recipeData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function getAllRecipes() {
  return prisma.recipe.findMany({
    where: { isActive: true },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      productions: {
        orderBy: {
          plannedDate: 'desc',
        },
        take: 5, // Last 5 productions
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getRecipeById(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      productions: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          plannedDate: 'desc',
        },
      },
    },
  });
}

export async function updateRecipe(id: string, data: UpdateRecipeData) {
  return prisma.recipe.update({
    where: { id },
    data,
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function toggleRecipeStatus(id: string) {
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return null;

  return prisma.recipe.update({
    where: { id },
    data: { isActive: !recipe.isActive },
  });
}

export async function deleteRecipe(id: string) {
  return prisma.recipe.delete({
    where: { id },
  });
}

// Recipe Item Management
export async function addRecipeItem(recipeId: string, itemData: CreateRecipeItemData) {
  return prisma.recipeItem.create({
    data: {
      recipeId,
      productId: itemData.productId,
      quantity: itemData.quantity,
      unit: itemData.unit,
      notes: itemData.notes,
    },
    include: {
      product: true,
    },
  });
}

export async function updateRecipeItem(id: string, data: Partial<CreateRecipeItemData>) {
  return prisma.recipeItem.update({
    where: { id },
    data,
    include: {
      product: true,
    },
  });
}

export async function deleteRecipeItem(id: string) {
  return prisma.recipeItem.delete({
    where: { id },
  });
}

// Production Planning
export async function createProduction(productionData: CreateProductionData) {
  const batchNumber = await generateBatchNumber();
  
  // Get recipe items to create production items
  const recipe = await prisma.recipe.findUnique({
    where: { id: productionData.recipeId },
    include: {
      items: true,
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  return prisma.production.create({
    data: {
      recipeId: productionData.recipeId,
      batchNumber,
      plannedQty: productionData.plannedQty,
      plannedDate: productionData.plannedDate,
      notes: productionData.notes,
      items: {
        create: recipe.items.map(item => ({
          productId: item.productId,
          plannedQty: Math.ceil((Number(item.quantity) * productionData.plannedQty) / recipe.servings),
        })),
      },
    },
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function getAllProductions() {
  return prisma.production.findMany({
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      plannedDate: 'desc',
    },
  });
}

export async function getProductionById(id: string) {
  return prisma.production.findUnique({
    where: { id },
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function getProductionByBatchNumber(batchNumber: string) {
  return prisma.production.findUnique({
    where: { batchNumber },
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function updateProduction(id: string, data: UpdateProductionData) {
  return prisma.production.update({
    where: { id },
    data: {
      ...data,
      startDate: data.status === 'IN_PROGRESS' && !data.startDate ? new Date() : data.startDate,
      endDate: data.status === 'COMPLETED' && !data.endDate ? new Date() : data.endDate,
    },
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function startProduction(id: string) {
  return prisma.production.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      startDate: new Date(),
    },
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function completeProduction(id: string, actualQty?: number) {
  return prisma.production.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      actualQty: actualQty,
      endDate: new Date(),
    },
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function cancelProduction(id: string) {
  return prisma.production.update({
    where: { id },
    data: {
      status: 'CANCELLED',
    },
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

// Production Item Management
export async function updateProductionItem(id: string, actualQty: number) {
  return prisma.productionItem.update({
    where: { id },
    data: { actualQty },
    include: {
      product: true,
    },
  });
}

// Production Planning and Alerts
export async function getProductionSchedule(startDate?: Date, endDate?: Date) {
  const start = startDate || new Date();
  const end = endDate || new Date();
  end.setDate(end.getDate() + 7); // Default to next 7 days

  return prisma.production.findMany({
    where: {
      plannedDate: {
        gte: start,
        lte: end,
      },
      status: {
        in: ['PLANNED', 'IN_PROGRESS'],
      },
    },
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      plannedDate: 'asc',
    },
  });
}

export async function getProductionAlerts() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Productions starting today or tomorrow
  const upcomingProductions = await prisma.production.findMany({
    where: {
      plannedDate: {
        gte: today,
        lte: tomorrow,
      },
      status: 'PLANNED',
    },
    include: {
      recipe: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  // Check for ingredient availability
  const alerts = [];
  
  for (const production of upcomingProductions) {
    const recipe = production.recipe;
    
    for (const item of recipe.items) {
      // Check inventory for this ingredient
      const inventory = await prisma.inventory.findMany({
        where: {
          productId: item.productId,
        },
      });

      const totalAvailable = inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      const requiredQty = Math.ceil((Number(item.quantity) * production.plannedQty) / recipe.servings);

      if (totalAvailable < requiredQty) {
        alerts.push({
          type: 'INSUFFICIENT_INGREDIENTS',
          production,
          ingredient: item.product,
          required: requiredQty,
          available: totalAvailable,
          shortage: requiredQty - totalAvailable,
        });
      }
    }
  }

  return alerts;
}

export async function getProductionEfficiency() {
  const productions = await prisma.production.findMany({
    where: {
      status: 'COMPLETED',
      actualQty: {
        not: null,
      },
    },
    include: {
      recipe: true,
    },
  });

  const efficiency = productions.map(production => {
    const efficiency = production.actualQty ? (production.actualQty / production.plannedQty) * 100 : 0;
    return {
      production,
      plannedQty: production.plannedQty,
      actualQty: production.actualQty,
      efficiency: Math.round(efficiency * 100) / 100,
    };
  });

  const avgEfficiency = efficiency.length > 0 
    ? efficiency.reduce((sum, item) => sum + item.efficiency, 0) / efficiency.length 
    : 0;

  return {
    productions: efficiency,
    averageEfficiency: Math.round(avgEfficiency * 100) / 100,
    totalProductions: productions.length,
  };
}

// Utility Functions
async function generateBatchNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `BATCH${year}${month}${day}`;
  
  const lastBatch = await prisma.production.findFirst({
    where: {
      batchNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      batchNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastBatch) {
    const lastSequence = parseInt(lastBatch.batchNumber.slice(-3));
    sequence = lastSequence + 1;
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

// Reports
export async function getProductionSummary() {
  const productions = await prisma.production.findMany({
    include: {
      recipe: true,
    },
  });

  const summary = {
    totalProductions: productions.length,
    byStatus: {} as Record<string, { count: number; plannedQty: number; actualQty: number }>,
    byRecipe: {} as Record<string, { count: number; plannedQty: number; actualQty: number }>,
    totalPlannedQty: 0,
    totalActualQty: 0,
    recentProductions: productions.slice(0, 10),
  };

  productions.forEach(production => {
    // By status
    if (!summary.byStatus[production.status]) {
      summary.byStatus[production.status] = { count: 0, plannedQty: 0, actualQty: 0 };
    }
    summary.byStatus[production.status].count++;
    summary.byStatus[production.status].plannedQty += production.plannedQty;
    summary.byStatus[production.status].actualQty += production.actualQty || 0;

    // By recipe
    if (!summary.byRecipe[production.recipe.name]) {
      summary.byRecipe[production.recipe.name] = { count: 0, plannedQty: 0, actualQty: 0 };
    }
    summary.byRecipe[production.recipe.name].count++;
    summary.byRecipe[production.recipe.name].plannedQty += production.plannedQty;
    summary.byRecipe[production.recipe.name].actualQty += production.actualQty || 0;

    summary.totalPlannedQty += production.plannedQty;
    summary.totalActualQty += production.actualQty || 0;
  });

  return summary;
}
