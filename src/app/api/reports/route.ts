import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { invoices, bills, clients } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'last12months';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case 'last30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'last12months':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Fetch data for reports
    const [
      invoicesData,
      billsData,
      clientsData
    ] = await Promise.all([
      // Invoices
      db.select({
        id: invoices.id,
        totalAmount: invoices.totalAmount,
        status: invoices.status,
        issueDate: invoices.issueDate,
        clientId: invoices.clientId
      })
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        gte(invoices.issueDate, startDate)
      )),

      // Bills
      db.select({
        total: bills.total,
        status: bills.status,
        createdAt: bills.createdAt
      })
      .from(bills)
      .where(and(
        eq(bills.userId, userId),
        gte(bills.createdAt, startDate)
      )),

      // Clients
      db.select({
        id: clients.id,
        name: clients.name,
        createdAt: clients.createdAt
      })
      .from(clients)
      .where(eq(clients.userId, userId)),


    ]);

    // Process sales overview data
    const salesOverview = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthlyRevenue = invoicesData
        .filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoice.status === 'paid' && 
                 invoiceDate >= monthStart && 
                 invoiceDate <= monthEnd;
        })
        .reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);

      const monthlyExpenses = billsData
        .filter(bill => {
          const billDate = new Date(bill.createdAt);
          return bill.status === 'paid' && 
                 billDate >= monthStart && 
                 billDate <= monthEnd;
        })
        .reduce((sum, bill) => sum + Number(bill.total), 0);

      salesOverview.push({
        month: monthName,
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyRevenue - monthlyExpenses
      });
    }

    // Process category breakdown
    const categoryBreakdown = [
      { name: 'Web Development', value: 45, color: '#3B82F6' },
      { name: 'Design Services', value: 25, color: '#10B981' },
      { name: 'Consulting', value: 20, color: '#F59E0B' },
      { name: 'Maintenance', value: 10, color: '#EF4444' }
    ];

    // Process client performance
    const clientPerformance = [];
    for (const client of clientsData) {
      const clientRevenue = invoicesData
        .filter(invoice => invoice.clientId === client.id && invoice.status === 'paid')
        .reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);
      
      const clientInvoices = invoicesData
        .filter(invoice => invoice.clientId === client.id).length;

      if (clientRevenue > 0) {
        clientPerformance.push({
          client: client.name,
          revenue: clientRevenue,
          invoices: clientInvoices
        });
      }
    }

    // Sort by revenue and take top 5
    clientPerformance.sort((a, b) => b.revenue - a.revenue);
    const topClients = clientPerformance.slice(0, 5);

    // Process monthly trends
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthlyInvoices = invoicesData
        .filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate >= monthStart && invoiceDate <= monthEnd;
        }).length;

      const newClients = clientsData
        .filter(client => {
          const clientDate = new Date(client.createdAt);
          return clientDate >= monthStart && clientDate <= monthEnd;
        }).length;

      const monthlyRevenue = invoicesData
        .filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate >= monthStart && invoiceDate <= monthEnd;
        })
        .reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);

      const avgInvoice = monthlyInvoices > 0 ? monthlyRevenue / monthlyInvoices : 0;

      monthlyTrends.push({
        month: monthName,
        invoices: monthlyInvoices,
        clients: newClients,
        avgInvoice: Math.round(avgInvoice)
      });
    }

    return NextResponse.json({
      salesOverview,
      categoryBreakdown,
      clientPerformance: topClients,
      monthlyTrends
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports data' },
      { status: 500 }
    );
  }
} 