import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { inventory, items, suppliers } from '@/db/schema';
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

    const inventoryList = await db
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
      .where(eq(inventory.userId, userId))
      .orderBy(desc(inventory.createdAt));

    return NextResponse.json(inventoryList);

  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
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

    const [newInventory] = await db.insert(inventory).values({
      userId,
      itemId,
      supplierId: supplierId || null,
      batchNumber,
      quantity: quantity.toString(),
      availableQuantity: quantity.toString(), // Initially same as quantity
      costPrice: costPrice.toString(),
      sellingPrice: sellingPrice.toString(),
      purchaseDate: new Date(purchaseDate),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      location,
      notes,
    }).returning();

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
      .where(eq(inventory.id, newInventory.id));

    return NextResponse.json(fullInventory, { status: 201 });

  } catch (error) {
    console.error('Create inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory' },
      { status: 500 }
    );
  }
} 