import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get expenses with pagination
    const expensesData = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, session.user.id))
      .orderBy(desc(expenses.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(expenses)
      .where(eq(expenses.userId, session.user.id));

    return NextResponse.json({
      expenses: expensesData,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Create expense
    const [expense] = await db.insert(expenses).values({
      userId: session.user.id,
      purchaseBillId: body.purchaseBillId || null,
      category: body.category,
      description: body.description,
      amount: body.amount.toString(),
      expenseDate: new Date(body.expenseDate),
      notes: body.notes || null,
    }).returning();

    return NextResponse.json({ 
      message: 'Expense created successfully',
      expense 
    });

  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
} 