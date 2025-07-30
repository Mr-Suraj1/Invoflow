import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { invoices, invoiceItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return NextResponse.json({ ...invoice, items });

  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { status } = body;

    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();

    if (!updatedInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(updatedInvoice);

  } catch (error) {
    console.error('Update invoice status error:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice status' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { 
      clientId, 
      invoiceNumber, 
      issueDate, 
      dueDate, 
      status, 
      notes, 
      taxRate, 
      taxAmount, 
      totalAmount,
      items 
    } = body;

    // Update invoice
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        clientId,
        invoiceNumber,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status,
        notes,
        taxRate: taxRate.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        updatedAt: new Date(),
      })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();

    if (!updatedInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Delete existing items and insert new ones
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    
    if (items && items.length > 0) {
      await db.insert(invoiceItems).values(
        items.map((item: any) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate.toString(),
          amount: item.amount.toString(),
        }))
      );
    }

    return NextResponse.json(updatedInvoice);

  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete invoice items first (due to foreign key constraint)
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

    // Delete the invoice
    const [deletedInvoice] = await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();

    if (!deletedInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' });

  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
} 