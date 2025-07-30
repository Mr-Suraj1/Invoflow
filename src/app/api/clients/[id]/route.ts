import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { clients } from '@/db/schema';
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
    const { name, email, phone, address } = body;

    const [updatedClient] = await db
      .update(clients)
      .set({
        name,
        email,
        phone,
        address,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();

    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(updatedClient);

  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
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

    const [deletedClient] = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();

    if (!deletedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Client deleted successfully' });

  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
} 