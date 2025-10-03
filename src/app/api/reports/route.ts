import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { 
  getReportData,
  getSalesTrendData,
  getTopProductsData,
  generateSalesReport,
  generateInventoryReport,
  generateCustomerReport,
  generateProductionReport,
  generateDeliveryReport,
  generateFinancialReport
} from '@/lib/reports-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const type = searchParams.get('type') || 'overview';

    let reportData;

    switch (type) {
      case 'sales':
        reportData = await generateSalesReport(period);
        break;
      case 'inventory':
        reportData = await generateInventoryReport(period);
        break;
      case 'customers':
        reportData = await generateCustomerReport(period);
        break;
      case 'production':
        reportData = await generateProductionReport(period);
        break;
      case 'delivery':
        reportData = await generateDeliveryReport(period);
        break;
      case 'financial':
        reportData = await generateFinancialReport(period);
        break;
      default:
        reportData = await getReportData(period);
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { reportType, period, format = 'json' } = body;

    let reportData;

    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReport(period);
        break;
      case 'inventory':
        reportData = await generateInventoryReport(period);
        break;
      case 'customers':
        reportData = await generateCustomerReport(period);
        break;
      case 'production':
        reportData = await generateProductionReport(period);
        break;
      case 'delivery':
        reportData = await generateDeliveryReport(period);
        break;
      case 'financial':
        reportData = await generateFinancialReport(period);
        break;
      default:
        reportData = await getReportData(period);
    }

    // Add metadata
    const responseData = {
      ...reportData,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: user.id,
        period,
        reportType,
        format
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
