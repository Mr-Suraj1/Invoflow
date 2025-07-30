import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { suppliers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
    const { name, contactPerson, email, phone, address, website, notes } = body;

    const [updatedSupplier] = await db
      .update(suppliers)
      .set({
        name,
        contactPerson,
        email,
        phone,
        address,
        website,
        notes,
        updatedAt: new Date(),
      })
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
      .returning();

    if (!updatedSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSupplier);

  } catch (error) {
    console.error('Update supplier error:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
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

    const [deletedSupplier] = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
      .returning();

    if (!deletedSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Supplier deleted successfully' });

  } catch (error) {
    console.error('Delete supplier error:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
} 