import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { items } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
    const { name, category, unit, description, costPrice, sellingPrice, quantity } = body;

    // Auto-generate SKU based on new values
    const generatedSKU = generateSKU(name, quantity, costPrice);

    const [updatedItem] = await db
      .update(items)
      .set({
        name,
        sku: generatedSKU,
        category,
        unit: unit || 'pcs',
        description,
        costPrice: costPrice.toString(),
        sellingPrice: sellingPrice.toString(),
        quantity: quantity.toString(),
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error('Update item error:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
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

    const [deletedItem] = await db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning();

    if (!deletedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' });

  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
} 