import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.category || !body.description || !body.amount || !body.expenseDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update expense
    const [expense] = await db
      .update(expenses)
      .set({
        purchaseBillId: body.purchaseBillId || null,
        category: body.category,
        description: body.description,
        amount: body.amount.toString(),
        expenseDate: new Date(body.expenseDate),
        notes: body.notes || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.userId, session.user.id)
        )
      )
      .returning();

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Expense updated successfully',
      expense 
    });

  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete expense
    const [expense] = await db
      .delete(expenses)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.userId, session.user.id)
        )
      )
      .returning();

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
} 