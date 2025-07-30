import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { purchaseBills, purchaseBillItems, purchaseBillExtraCharges, inventory, expenses } from '@/db/schema';
import { purchaseBillSchema } from '@/lib/schemas';
import { eq } from 'drizzle-orm';
import { inArray } from 'drizzle-orm';
import { suppliers } from '@/db/schema'; // Added missing import for suppliers
import { sql } from 'drizzle-orm'; // Added missing import for sql
import { items } from '@/db/schema'; // Added missing import for items

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = purchaseBillSchema.parse(body);

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.costPrice);
    }, 0);

    const tax = (subtotal * validatedData.taxRate) / 100;
    const extraChargesTotal = validatedData.extraCharges.reduce((sum, charge) => {
      return sum + charge.amount;
    }, 0);
    const total = subtotal + tax + extraChargesTotal;

    // Create purchase bill
    const [purchaseBill] = await db.insert(purchaseBills).values({
      userId: session.user.id,
      supplierId: validatedData.supplierId || null,
      billNumber: validatedData.billNumber,
      billDate: new Date(validatedData.billDate),
      subtotal: subtotal.toString(),
      taxRate: validatedData.taxRate.toString(),
      tax: tax.toString(),
      extraChargesTotal: extraChargesTotal.toString(),
      total: total.toString(),
      status: validatedData.status,
      notes: validatedData.notes || null,
      location: validatedData.location || null,
    }).returning();

    // Create purchase bill items
    const purchaseBillItemsData = validatedData.items.map(item => ({
      purchaseBillId: purchaseBill.id,
      itemId: item.itemId,
      quantity: item.quantity.toString(),
      costPrice: item.costPrice.toString(),
      total: (item.quantity * item.costPrice).toString(),
      batchNumber: item.batchNumber || null,
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
    }));

    await db.insert(purchaseBillItems).values(purchaseBillItemsData);

    // Create extra charges
    if (validatedData.extraCharges.length > 0) {
      const extraChargesData = validatedData.extraCharges.map(charge => ({
        purchaseBillId: purchaseBill.id,
        name: charge.name,
        amount: charge.amount.toString(),
      }));

      await db.insert(purchaseBillExtraCharges).values(extraChargesData);
    }

    // Create inventory entries for each item
    // Fetch selling prices for all items in one query
    const itemIds = validatedData.items.map(item => item.itemId);
    const itemsCatalog = await db.select({ id: items.id, sellingPrice: items.sellingPrice })
      .from(items)
      .where(inArray(items.id, itemIds));
    const sellingPriceMap = Object.fromEntries(itemsCatalog.map(i => [i.id, i.sellingPrice]));

    const inventoryData = validatedData.items.map(item => ({
      userId: session.user.id,
      itemId: item.itemId,
      supplierId: validatedData.supplierId || null,
      purchaseBillId: purchaseBill.id,
      batchNumber: item.batchNumber || null,
      quantity: item.quantity.toString(),
      availableQuantity: item.quantity.toString(), // Initially all quantity is available
      costPrice: item.costPrice.toString(),
      sellingPrice: sellingPriceMap[item.itemId]?.toString() ?? item.costPrice.toString(), // Fetch from items, fallback to costPrice
      purchaseDate: new Date(validatedData.billDate),
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
      location: validatedData.location || null,
      notes: validatedData.notes || null,
    }));

    await db.insert(inventory).values(inventoryData);

    // Create expense record for the total purchase amount
    if (total > 0) {
      const hasExtraCharges = validatedData.extraCharges.length > 0;
      const description = hasExtraCharges 
        ? `Purchase bill ${validatedData.billNumber} (includes ${validatedData.extraCharges.length} extra charges)`
        : `Purchase bill ${validatedData.billNumber}`;
      
      await db.insert(expenses).values({
        userId: session.user.id,
        purchaseBillId: purchaseBill.id,
        category: 'purchase',
        description: description,
        amount: total.toString(),
        expenseDate: new Date(validatedData.billDate),
        notes: validatedData.notes || null,
      });
    }

    // Note: Extra charges are included in the total purchase expense above
    // Users can manually add separate expense records for extra charges if needed

    return NextResponse.json({ 
      message: 'Purchase bill created successfully',
      purchaseBillId: purchaseBill.id 
    });

  } catch (error) {
    console.error('Error creating purchase bill:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase bill' },
      { status: 500 }
    );
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get purchase bills with related data
    const purchaseBillsData = await db
      .select({
        id: purchaseBills.id,
        userId: purchaseBills.userId,
        supplierId: purchaseBills.supplierId,
        billNumber: purchaseBills.billNumber,
        billDate: purchaseBills.billDate,
        subtotal: purchaseBills.subtotal,
        taxRate: purchaseBills.taxRate,
        tax: purchaseBills.tax,
        extraChargesTotal: purchaseBills.extraChargesTotal,
        total: purchaseBills.total,
        status: purchaseBills.status,
        notes: purchaseBills.notes,
        location: purchaseBills.location,
        createdAt: purchaseBills.createdAt,
        updatedAt: purchaseBills.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contactPerson: suppliers.contactPerson,
          email: suppliers.email,
          phone: suppliers.phone,
        },
      })
      .from(purchaseBills)
      .leftJoin(suppliers, eq(purchaseBills.supplierId, suppliers.id))
      .where(eq(purchaseBills.userId, session.user.id))
      .orderBy(purchaseBills.createdAt)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(purchaseBills)
      .where(eq(purchaseBills.userId, session.user.id));

    return NextResponse.json({
      purchaseBills: purchaseBillsData,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching purchase bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase bills' },
      { status: 500 }
    );
  }
} 