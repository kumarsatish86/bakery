import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, getProductsByCategory } from '@/lib/product-service';

// GET /api/public/products - Get all products for public website
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching public products...');
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    console.log('Category:', category, 'Limit:', limit);

    let products;

    if (category && category !== 'All') {
      console.log('Fetching products by category:', category);
      products = await getProductsByCategory(category);
    } else {
      console.log('Fetching all products');
      products = await getAllProducts();
    }

    console.log('Found products:', products.length);

    // Limit results if specified
    if (limit) {
      products = products.slice(0, parseInt(limit));
    }

    // Transform products for public display
    const publicProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.sellingPrice,
      image: `/api/placeholder/300/300`, // Placeholder for now
      isNew: product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // New if created within last 7 days
      isEggless: product.category === 'BREAD' || product.category === 'COOKIE' || product.category === 'BEVERAGE', // Simple logic for demo
      sku: product.sku,
      unitType: product.unitType,
      weight: product.weight,
      shelfLife: product.shelfLife
    }));

    console.log('Transformed products:', publicProducts.length);
    return NextResponse.json({ products: publicProducts });
  } catch (error) {
    console.error('Error fetching public products:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
