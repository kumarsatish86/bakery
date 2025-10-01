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

// ===== PRODUCT MANAGEMENT =====

export interface CreateProductData {
  sku: string;
  name: string;
  description?: string;
  barcode?: string;
  category: 'BREAD' | 'PASTRY' | 'CAKE' | 'COOKIE' | 'BEVERAGE' | 'SANDWICH' | 'SALAD' | 'OTHER';
  basePrice: number;
  sellingPrice: number;
  costPrice: number;
  taxRate?: number;
  taxType?: 'GST' | 'VAT' | 'NONE';
  unitType?: 'PIECE' | 'KG' | 'GRAM' | 'LITER' | 'ML' | 'PACK' | 'BOX';
  minStockLevel?: number;
  maxStockLevel?: number;
  weight?: number;
  dimensions?: string;
  shelfLife?: number;
  imageUrl?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  barcode?: string;
  category?: 'BREAD' | 'PASTRY' | 'CAKE' | 'COOKIE' | 'BEVERAGE' | 'SANDWICH' | 'SALAD' | 'OTHER';
  basePrice?: number;
  sellingPrice?: number;
  costPrice?: number;
  taxRate?: number;
  taxType?: 'GST' | 'VAT' | 'NONE';
  unitType?: 'PIECE' | 'KG' | 'GRAM' | 'LITER' | 'ML' | 'PACK' | 'BOX';
  minStockLevel?: number;
  maxStockLevel?: number;
  weight?: number;
  dimensions?: string;
  shelfLife?: number;
  imageUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
}

export interface CreateProductVariantData {
  productId: string;
  name: string;
  value: string;
  sku?: string;
  priceAdjustment?: number;
}

// Product CRUD Operations
export async function createProduct(productData: CreateProductData) {
  return prisma.product.create({
    data: {
      sku: productData.sku,
      name: productData.name,
      description: productData.description,
      barcode: productData.barcode,
      category: productData.category,
      basePrice: productData.basePrice,
      sellingPrice: productData.sellingPrice,
      costPrice: productData.costPrice,
      taxRate: productData.taxRate || 0,
      taxType: productData.taxType || 'GST',
      unitType: productData.unitType || 'PIECE',
      minStockLevel: productData.minStockLevel || 0,
      maxStockLevel: productData.maxStockLevel,
      weight: productData.weight,
      dimensions: productData.dimensions,
      shelfLife: productData.shelfLife,
      imageUrl: productData.imageUrl,
    },
    include: {
      variants: true,
      inventory: true,
    },
  });
}

export async function getAllProducts() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      inventory: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert Decimal fields to numbers
  return products.map(product => ({
    ...product,
    basePrice: Number(product.basePrice),
    sellingPrice: Number(product.sellingPrice),
    costPrice: Number(product.costPrice),
    taxRate: Number(product.taxRate),
  }));
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      inventory: true,
      orderItems: {
        include: {
          order: true,
        },
      },
    },
  });

  if (!product) return null;

  // Convert Decimal fields to numbers
  return {
    ...product,
    basePrice: Number(product.basePrice),
    sellingPrice: Number(product.sellingPrice),
    costPrice: Number(product.costPrice),
    taxRate: Number(product.taxRate),
  };
}

export async function getProductBySku(sku: string) {
  return prisma.product.findUnique({
    where: { sku },
    include: {
      variants: true,
      inventory: true,
    },
  });
}

export async function getProductByBarcode(barcode: string) {
  return prisma.product.findUnique({
    where: { barcode },
    include: {
      variants: true,
      inventory: true,
    },
  });
}

export async function updateProduct(id: string, productData: UpdateProductData) {
  return prisma.product.update({
    where: { id },
    data: productData,
    include: {
      variants: true,
      inventory: true,
    },
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({
    where: { id },
  });
}

export async function toggleProductStatus(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return null;

  const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  return prisma.product.update({
    where: { id },
    data: { status: newStatus },
  });
}

// Product Variant Operations
export async function createProductVariant(variantData: CreateProductVariantData) {
  return prisma.productVariant.create({
    data: {
      productId: variantData.productId,
      name: variantData.name,
      value: variantData.value,
      sku: variantData.sku,
      priceAdjustment: variantData.priceAdjustment || 0,
    },
  });
}

export async function getProductVariants(productId: string) {
  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

export async function updateProductVariant(id: string, data: Partial<CreateProductVariantData>) {
  return prisma.productVariant.update({
    where: { id },
    data,
  });
}

export async function deleteProductVariant(id: string) {
  return prisma.productVariant.delete({
    where: { id },
  });
}

// Product Search and Filtering
export async function searchProducts(query: string) {
  return prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      variants: true,
      inventory: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getProductsByCategory(category: string) {
  return prisma.product.findMany({
    where: { category: category as 'BREAD' | 'PASTRY' | 'CAKE' | 'COOKIE' | 'BEVERAGE' | 'SANDWICH' | 'SALAD' | 'OTHER' },
    include: {
      variants: true,
      inventory: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      variants: true,
      inventory: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Filter products with low stock
  return products.filter(product => {
    const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    return totalQuantity <= product.minStockLevel;
  });
}

// Bulk Operations
export async function bulkCreateProducts(products: CreateProductData[]) {
  const results = [];
  for (const product of products) {
    try {
      const result = await createProduct(product);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: error, data: product });
    }
  }
  return results;
}

export async function bulkUpdateProducts(updates: { id: string; data: UpdateProductData }[]) {
  const results = [];
  for (const update of updates) {
    try {
      const result = await updateProduct(update.id, update.data);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: error, data: update });
    }
  }
  return results;
}
