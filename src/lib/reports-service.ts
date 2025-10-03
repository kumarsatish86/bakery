import { prisma } from './database';

export interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockItems: number;
  pendingOrders: number;
  completedDeliveries: number;
  activeSuppliers: number;
  salesTrend?: Array<{ date: string; revenue: number; orders: number }>;
  topProducts?: Array<{ name: string; sales: number; revenue: number }>;
}

export interface SalesReportData extends ReportData {
  revenueByPeriod: Array<{ period: string; revenue: number }>;
  orderStatusBreakdown: Array<{ status: string; count: number }>;
  averageOrderValue: number;
  conversionRate: number;
}

export interface InventoryReportData {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  categoryBreakdown: Array<{ category: string; count: number; value: number }>;
  topMovingItems: Array<{ name: string; quantity: number; value: number }>;
}

export interface CustomerReportData {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customerSegments: Array<{ segment: string; count: number; revenue: number }>;
  topCustomers: Array<{ name: string; orders: number; revenue: number }>;
}

export interface ProductionReportData {
  totalBatches: number;
  completedBatches: number;
  averageProductionTime: number;
  recipePerformance: Array<{ recipe: string; batches: number; successRate: number }>;
  productionTrend: Array<{ date: string; batches: number; quantity: number }>;
}

export interface DeliveryReportData {
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  deliveryStatusBreakdown: Array<{ status: string; count: number }>;
  topDeliveryAreas: Array<{ area: string; deliveries: number }>;
}

export interface FinancialReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByCategory: Array<{ category: string; revenue: number }>;
  expenseBreakdown: Array<{ category: string; amount: number }>;
}

// Helper function to get date range based on period
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '1d':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }

  return { startDate, endDate };
}

// Main overview report data
export async function getReportData(period: string): Promise<ReportData> {
  try {
    const { startDate, endDate } = getDateRange(period);

    // Get basic counts
    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      totalSuppliers,
      lowStockInventory,
      pendingOrders,
      completedDeliveries,
      ordersRevenue
    ] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.inventory.count({
        where: {
          quantity: { lt: 10 } // Low stock threshold
        }
      }),
      prisma.order.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      }),
      prisma.delivery.count({
        where: {
          status: 'DELIVERED',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    // Get sales trend data
    const salesTrend = await getSalesTrendData(period);
    const topProducts = await getTopProductsData(period);

    return {
      totalRevenue: Number(ordersRevenue._sum.totalAmount) || 0,
      totalOrders,
      totalProducts,
      totalCustomers,
      lowStockItems: lowStockInventory,
      pendingOrders,
      completedDeliveries,
      activeSuppliers: totalSuppliers,
      salesTrend,
      topProducts
    };
  } catch (error) {
    console.error('Error generating report data:', error);
    // Return default values if database query fails
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      lowStockItems: 0,
      pendingOrders: 0,
      completedDeliveries: 0,
      activeSuppliers: 0,
      salesTrend: [],
      topProducts: []
    };
  }
}

// Sales trend data for charts
export async function getSalesTrendData(period: string): Promise<Array<{ date: string; revenue: number; orders: number }>> {
  try {
    getDateRange(period); // Get date range for future use
    
    // Generate sample trend data for demonstration
    const trendData = [];
    const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic sample data
      const baseRevenue = 5000 + Math.random() * 3000;
      const baseOrders = 10 + Math.floor(Math.random() * 20);
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(baseRevenue),
        orders: baseOrders
      });
    }
    
    return trendData;
  } catch (error) {
    console.error('Error generating sales trend data:', error);
    return [];
  }
}

// Top products data for charts
export async function getTopProductsData(_period: string): Promise<Array<{ name: string; sales: number; revenue: number }>> {
  try {
    // Generate sample top products data
    const sampleProducts = [
      { name: 'Artisan Bread', sales: 45, revenue: 2250 },
      { name: 'Chocolate Croissant', sales: 38, revenue: 1900 },
      { name: 'Sourdough Loaf', sales: 32, revenue: 1600 },
      { name: 'Danish Pastry', sales: 28, revenue: 1400 },
      { name: 'Bagels', sales: 25, revenue: 1250 }
    ];
    
    return sampleProducts;
  } catch (error) {
    console.error('Error generating top products data:', error);
    return [];
  }
}

// Detailed sales report
export async function generateSalesReport(period: string): Promise<SalesReportData> {
  try {
    const baseData = await getReportData(period);
    
    // Generate additional sales-specific data
    const revenueByPeriod = [
      { period: 'Week 1', revenue: 12000 },
      { period: 'Week 2', revenue: 15000 },
      { period: 'Week 3', revenue: 18000 },
      { period: 'Week 4', revenue: 16000 }
    ];
    
    const orderStatusBreakdown = [
      { status: 'DELIVERED', count: 45 },
      { status: 'PENDING', count: 12 },
      { status: 'CONFIRMED', count: 8 },
      { status: 'CANCELLED', count: 3 }
    ];
    
    return {
      ...baseData,
      revenueByPeriod,
      orderStatusBreakdown,
      averageOrderValue: baseData.totalOrders > 0 ? baseData.totalRevenue / baseData.totalOrders : 0,
      conversionRate: 85.5
    };
  } catch (error) {
    console.error('Error generating sales report:', error);
    throw error;
  }
}

// Inventory report
export async function generateInventoryReport(_period: string): Promise<InventoryReportData> {
  try {
    getDateRange(_period); // Get date range for future use
    
    // Get inventory data
    const [totalItems, lowStockItems, outOfStockItems] = await Promise.all([
      prisma.inventory.count(),
      prisma.inventory.count({ where: { quantity: { lt: 10 } } }),
      prisma.inventory.count({ where: { quantity: 0 } })
    ]);
    
    // Generate sample data
    const categoryBreakdown = [
      { category: 'Bread', count: 25, value: 15000 },
      { category: 'Pastries', count: 18, value: 12000 },
      { category: 'Cakes', count: 12, value: 18000 },
      { category: 'Cookies', count: 15, value: 8000 }
    ];
    
    const topMovingItems = [
      { name: 'Artisan Bread', quantity: 45, value: 2250 },
      { name: 'Chocolate Croissant', quantity: 38, value: 1900 },
      { name: 'Sourdough Loaf', quantity: 32, value: 1600 }
    ];
    
    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue: 53000,
      categoryBreakdown,
      topMovingItems
    };
  } catch (error) {
    console.error('Error generating inventory report:', error);
    throw error;
  }
}

// Customer analytics report
export async function generateCustomerReport(period: string): Promise<CustomerReportData> {
  try {
    const { startDate, endDate } = getDateRange(period);
    
    const [totalCustomers, newCustomers] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);
    
    // Generate sample customer data
    const customerSegments = [
      { segment: 'Premium', count: 25, revenue: 25000 },
      { segment: 'Regular', count: 150, revenue: 45000 },
      { segment: 'New', count: 30, revenue: 8000 }
    ];
    
    const topCustomers = [
      { name: 'John Smith', orders: 12, revenue: 2400 },
      { name: 'Sarah Johnson', orders: 10, revenue: 2000 },
      { name: 'Mike Brown', orders: 8, revenue: 1600 }
    ];
    
    return {
      totalCustomers,
      newCustomers,
      activeCustomers: Math.floor(totalCustomers * 0.7),
      customerSegments,
      topCustomers
    };
  } catch (error) {
    console.error('Error generating customer report:', error);
    throw error;
  }
}

// Production report
export async function generateProductionReport(period: string): Promise<ProductionReportData> {
  try {
    const { startDate, endDate } = getDateRange(period);
    
    const [totalBatches, completedBatches] = await Promise.all([
      prisma.production.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.production.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);
    
    // Generate sample production data
    const recipePerformance = [
      { recipe: 'Artisan Bread', batches: 15, successRate: 95 },
      { recipe: 'Sourdough', batches: 12, successRate: 90 },
      { recipe: 'Croissants', batches: 8, successRate: 85 }
    ];
    
    const productionTrend = [];
    const days = period === '7d' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      productionTrend.push({
        date: date.toISOString().split('T')[0],
        batches: Math.floor(Math.random() * 5) + 1,
        quantity: Math.floor(Math.random() * 50) + 20
      });
    }
    
    return {
      totalBatches,
      completedBatches,
      averageProductionTime: 2.5, // hours
      recipePerformance,
      productionTrend
    };
  } catch (error) {
    console.error('Error generating production report:', error);
    throw error;
  }
}

// Delivery report
export async function generateDeliveryReport(period: string): Promise<DeliveryReportData> {
  try {
    const { startDate, endDate } = getDateRange(period);
    
    const [totalDeliveries, completedDeliveries] = await Promise.all([
      prisma.delivery.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.delivery.count({
        where: {
          status: 'DELIVERED',
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);
    
    // Generate sample delivery data
    const deliveryStatusBreakdown = [
      { status: 'DELIVERED', count: 45 },
      { status: 'IN_TRANSIT', count: 8 },
      { status: 'SCHEDULED', count: 5 },
      { status: 'FAILED', count: 2 }
    ];
    
    const topDeliveryAreas = [
      { area: 'Downtown', deliveries: 25 },
      { area: 'Suburbs', deliveries: 18 },
      { area: 'Industrial', deliveries: 12 }
    ];
    
    return {
      totalDeliveries,
      completedDeliveries,
      averageDeliveryTime: 1.2, // hours
      deliveryStatusBreakdown,
      topDeliveryAreas
    };
  } catch (error) {
    console.error('Error generating delivery report:', error);
    throw error;
  }
}

// Financial report
export async function generateFinancialReport(period: string): Promise<FinancialReportData> {
  try {
    const baseData = await getReportData(period);
    
    // Generate sample financial data
    const totalExpenses = baseData.totalRevenue * 0.6; // 60% expense ratio
    const netProfit = baseData.totalRevenue - totalExpenses;
    
    const revenueByCategory = [
      { category: 'Bread', revenue: 25000 },
      { category: 'Pastries', revenue: 18000 },
      { category: 'Cakes', revenue: 15000 },
      { category: 'Cookies', revenue: 8000 }
    ];
    
    const expenseBreakdown = [
      { category: 'Ingredients', amount: 20000 },
      { category: 'Labor', amount: 15000 },
      { category: 'Utilities', amount: 5000 },
      { category: 'Marketing', amount: 3000 }
    ];
    
    return {
      totalRevenue: baseData.totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: baseData.totalRevenue > 0 ? (netProfit / baseData.totalRevenue) * 100 : 0,
      revenueByCategory,
      expenseBreakdown
    };
  } catch (error) {
    console.error('Error generating financial report:', error);
    throw error;
  }
}
