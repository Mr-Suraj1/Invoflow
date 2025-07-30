import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { suppliers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const suppliersList = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.userId, userId))
      .orderBy(desc(suppliers.createdAt));

    return NextResponse.json(suppliersList);

  } catch (error) {
    console.error('Suppliers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const { name, contactPerson, email, phone, address, website, notes } = body;

    const [newSupplier] = await db.insert(suppliers).values({
      userId,
      name,
      contactPerson,
      email,
      phone,
      address,
      website,
      notes,
    }).returning();

    return NextResponse.json(newSupplier, { status: 201 });

  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
} 