import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { invoices, invoiceItems, clients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch invoices with client information
    const invoicesWithClients = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        clientName: clients.name,
        clientEmail: clients.email,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json(invoicesWithClients);

  } catch (error) {
    console.error('Invoices API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      clientId,
      invoiceNumber,
      issueDate,
      dueDate,
      notes,
      items,
      taxRate,
      subtotal,
      taxAmount,
      totalAmount,
      status = 'draft'
    } = body;

    // Create invoice
    const [newInvoice] = await db.insert(invoices).values({
      userId,
      clientId,
      invoiceNumber,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      status,
      subtotal: subtotal.toString(),
      taxRate: taxRate.toString(),
      taxAmount: taxAmount.toString(),
      totalAmount: totalAmount.toString(),
      notes,
    }).returning();

    // Create invoice items
    if (items && items.length > 0) {
      const invoiceItemsData = items.map((item: any) => ({
        invoiceId: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate.toString(),
        total: item.total.toString(),
      }));

      await db.insert(invoiceItems).values(invoiceItemsData);
    }

    return NextResponse.json(newInvoice, { status: 201 });

  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
} 