import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { items } from '@/db/schema';
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

    const itemsList = await db
      .select()
      .from(items)
      .where(eq(items.userId, userId))
      .orderBy(desc(items.createdAt));

    return NextResponse.json(itemsList);

  } catch (error) {
    console.error('Items API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// Helper function to generate SKU
function generateSKU(name: string, quantity: number, costPrice: number): string {
  // Take first 3 letters of name (uppercase)
  const namePrefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  
  // Add quantity as integer
  const qtyPart = Math.floor(quantity).toString();
  
  // Add cost price as integer (remove decimals)
  const pricePart = Math.floor(costPrice).toString();
  
  // Combine with hyphens
  return `${namePrefix}-${qtyPart}-${pricePart}`;
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

    const { name, category, unit, description, costPrice, sellingPrice, quantity } = body;

    // Auto-generate SKU if not provided
    const generatedSKU = generateSKU(name, quantity, costPrice);

    const [newItem] = await db.insert(items).values({
      userId,
      name,
      sku: generatedSKU,
      category,
      unit: unit || 'pcs',
      description,
      costPrice: costPrice.toString(),
      sellingPrice: sellingPrice.toString(),
      quantity: quantity.toString(),
    }).returning();

    return NextResponse.json(newItem, { status: 201 });

  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
} 