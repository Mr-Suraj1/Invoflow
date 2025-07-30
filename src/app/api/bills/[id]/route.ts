import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { bills, billItems, billExtraCharges, inventory, clients, items } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: billId } = await params;

    // Get bill with client information
    const billHeader = await db
      .select({
        id:            bills.id,
        billNumber:    bills.billNumber,
        invoiceNumber: bills.invoiceNumber,
        billDate:      bills.billDate,
        subtotal:      bills.subtotal,
        taxRate:       bills.taxRate,
        tax:           bills.tax,
        extraChargesTotal: bills.extraChargesTotal,
        total:         bills.total,
        status:        bills.status,
        notes:         bills.notes,
        createdAt:     bills.createdAt,
        updatedAt:     bills.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          phone: clients.phone,
          address: clients.address,
        }
      })
      .from(bills)
      .leftJoin(clients, eq(bills.clientId, clients.id))
      .where(and(eq(bills.id, billId), eq(bills.userId, userId)))
      .limit(1);

    if (billHeader.length === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const bill = billHeader[0];

    // Get bill items with inventory and item details
    const billItemsResult = await db
      .select({
        id: billItems.id,
        inventoryId: billItems.inventoryId,
        quantity: billItems.quantity,
        sellingPrice: billItems.sellingPrice,
        total: billItems.total,
        inventoryId2: inventory.id,
        itemId: items.id,
        itemName: items.name,
        itemSku: items.sku,
        itemUnit: items.unit,
      })
      .from(billItems)
      .leftJoin(inventory, eq(billItems.inventoryId, inventory.id))
      .leftJoin(items, eq(inventory.itemId, items.id))
      .where(eq(billItems.billId, billId));

    // Reconstruct the nested object structure
    const formattedBillItems = billItemsResult.map(item => ({
      id: item.id,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      total: item.total,
      inventory: {
        id: item.inventoryId2,
        item: {
          id: item.itemId,
          name: item.itemName,
          sku: item.itemSku,
          unit: item.itemUnit,
        }
      }
    }));

    // Get extra charges
    const extraChargesResult = await db
      .select()
      .from(billExtraCharges)
      .where(eq(billExtraCharges.billId, billId));

    // Combine all data
    const fullBill = {
      ...bill,
      items: formattedBillItems,
      extraCharges: extraChargesResult
    };

    return NextResponse.json(fullBill);

  } catch (error) {
    console.error('Get bill API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: billId } = await params;
    const body = await request.json();

    // Check if bill exists and belongs to user
    const existingBill = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, billId), eq(bills.userId, userId)))
      .limit(1);

    if (existingBill.length === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Get current bill items to restore inventory
    const currentItems = await db
      .select()
      .from(billItems)
      .where(eq(billItems.billId, billId));

    // Restore inventory quantities
    for (const item of currentItems) {
      const currentInventory = await db
        .select({ availableQuantity: inventory.availableQuantity })
        .from(inventory)
        .where(eq(inventory.id, item.inventoryId))
        .limit(1);

      if (currentInventory.length > 0) {
        const newQuantity = parseFloat(currentInventory[0].availableQuantity) + parseFloat(item.quantity);
        await db
          .update(inventory)
          .set({
            availableQuantity: newQuantity.toString()
          })
          .where(eq(inventory.id, item.inventoryId));
      }
    }

    // Delete current items and extra charges
    await db.delete(billItems).where(eq(billItems.billId, billId));
    await db.delete(billExtraCharges).where(eq(billExtraCharges.billId, billId));

    // Calculate new totals
    let subtotal = 0;
    const newItems = [];

    // Process items
    for (const item of body.items || []) {
      const itemTotal = item.quantity * item.sellingPrice;
      subtotal += itemTotal;

      // Insert new bill item
      const [newItem] = await db
        .insert(billItems)
        .values({
          billId,
          inventoryId: item.inventoryId,
          quantity: item.quantity.toString(),
          sellingPrice: item.sellingPrice.toString(),
          total: itemTotal.toString()
        })
        .returning();

      newItems.push(newItem);

      // Update inventory
      const currentInventory = await db
        .select({ availableQuantity: inventory.availableQuantity })
        .from(inventory)
        .where(eq(inventory.id, item.inventoryId))
        .limit(1);

      if (currentInventory.length > 0) {
        const newQuantity = parseFloat(currentInventory[0].availableQuantity) - item.quantity;
        await db
          .update(inventory)
          .set({
            availableQuantity: newQuantity.toString()
          })
          .where(eq(inventory.id, item.inventoryId));
      }
    }

    // Process extra charges
    let extraChargesTotal = 0;
    for (const charge of body.extraCharges || []) {
      extraChargesTotal += charge.amount;
      await db.insert(billExtraCharges).values({
        billId,
        name: charge.name,
        amount: charge.amount.toString()
      });
    }

    // Calculate tax and total
    const taxRate = parseFloat(body.taxRate || 0);
    const tax = (subtotal + extraChargesTotal) * (taxRate / 100);
    const total = subtotal + extraChargesTotal + tax;

    // Update bill
    await db
      .update(bills)
      .set({
        clientId: body.clientId,
        billDate: new Date(body.billDate),
        invoiceNumber: body.invoiceNumber,
        status: body.status,
        subtotal: subtotal.toString(),
        taxRate: taxRate.toString(),
        tax: tax.toString(),
        extraChargesTotal: extraChargesTotal.toString(),
        total: total.toString(),
        notes: body.notes,
        updatedAt: new Date()
      })
      .where(eq(bills.id, billId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update bill API error:', error);
    return NextResponse.json(
      { error: 'Failed to update bill' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: billId } = await params;
    const body = await request.json();

    // Check if bill exists and belongs to user
    const existingBill = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, billId), eq(bills.userId, userId)))
      .limit(1);

    if (existingBill.length === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Update only the provided fields (partial update)
    const [updatedBill] = await db
      .update(bills)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(bills.id, billId), eq(bills.userId, userId)))
      .returning();

    return NextResponse.json(updatedBill);

  } catch (error) {
    console.error('Patch bill API error:', error);
    return NextResponse.json(
      { error: 'Failed to update bill' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: billId } = await params;

    // Check if bill exists and belongs to user
    const existingBill = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, billId), eq(bills.userId, userId)))
      .limit(1);

    if (existingBill.length === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Get bill items to restore inventory
    const billItemsList = await db
      .select()
      .from(billItems)
      .where(eq(billItems.billId, billId));

    // Restore inventory quantities
    for (const item of billItemsList) {
      const currentInventory = await db
        .select()
        .from(inventory)
        .where(eq(inventory.id, item.inventoryId))
        .limit(1);

      if (currentInventory.length > 0) {
        const newAvailableQuantity = parseFloat(currentInventory[0].availableQuantity) + parseFloat(item.quantity);
        
        await db
          .update(inventory)
          .set({ 
            availableQuantity: newAvailableQuantity.toString(),
            updatedAt: new Date()
          })
          .where(eq(inventory.id, item.inventoryId));
      }
    }

    // Delete bill items and extra charges first (foreign key constraints)
    await db.delete(billItems).where(eq(billItems.billId, billId));
    await db.delete(billExtraCharges).where(eq(billExtraCharges.billId, billId));

    // Delete the bill
    await db
      .delete(bills)
      .where(and(eq(bills.id, billId), eq(bills.userId, userId)));

    return NextResponse.json({ 
      message: 'Bill deleted successfully and inventory restored' 
    });

  } catch (error) {
    console.error('Delete bill API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
} 