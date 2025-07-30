import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { inventory, items, suppliers } from '@/db/schema';
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
    
    const { 
      itemId, 
      supplierId, 
      batchNumber, 
      quantity, 
      costPrice, 
      sellingPrice, 
      purchaseDate, 
      expiryDate, 
      location, 
      notes 
    } = body;

    const [updatedInventory] = await db
      .update(inventory)
      .set({
        itemId,
        supplierId: supplierId || null,
        batchNumber,
        quantity: quantity.toString(),
        costPrice: costPrice.toString(),
        sellingPrice: sellingPrice.toString(),
        purchaseDate: new Date(purchaseDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        location,
        notes,
        updatedAt: new Date(),
      })
      .where(and(eq(inventory.id, id), eq(inventory.userId, userId)))
      .returning();

    if (!updatedInventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    // Get the full inventory record with item and supplier details
    const [fullInventory] = await db
      .select({
        id: inventory.id,
        userId: inventory.userId,
        itemId: inventory.itemId,
        supplierId: inventory.supplierId,
        batchNumber: inventory.batchNumber,
        quantity: inventory.quantity,
        availableQuantity: inventory.availableQuantity,
        costPrice: inventory.costPrice,
        sellingPrice: inventory.sellingPrice,
        purchaseDate: inventory.purchaseDate,
        expiryDate: inventory.expiryDate,
        location: inventory.location,
        notes: inventory.notes,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
        item: {
          id: items.id,
          name: items.name,
          sku: items.sku,
          unit: items.unit,
          costPrice: items.costPrice,
          sellingPrice: items.sellingPrice,
        },
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contactPerson: suppliers.contactPerson,
          email: suppliers.email,
          phone: suppliers.phone,
        }
      })
      .from(inventory)
      .leftJoin(items, eq(inventory.itemId, items.id))
      .leftJoin(suppliers, eq(inventory.supplierId, suppliers.id))
      .where(eq(inventory.id, id));

    return NextResponse.json(fullInventory);

  } catch (error) {
    console.error('Update inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
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

    const [deletedInventory] = await db
      .delete(inventory)
      .where(and(eq(inventory.id, id), eq(inventory.userId, userId)))
      .returning();

    if (!deletedInventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Inventory deleted successfully' });

  } catch (error) {
    console.error('Delete inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory' },
      { status: 500 }
    );
  }
} 