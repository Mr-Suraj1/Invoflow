import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { clients } from '@/db/schema';
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

    const clientsList = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.createdAt));

    return NextResponse.json(clientsList);

  } catch (error) {
    console.error('Clients API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
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

    const { name, email, phone, address } = body;

    const [newClient] = await db.insert(clients).values({
      userId,
      name,
      email,
      phone,
      address,
    }).returning();

    return NextResponse.json(newClient, { status: 201 });

  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
} 