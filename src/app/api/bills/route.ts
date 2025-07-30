import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { bills, billItems, billExtraCharges, inventory, clients, items } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { extendedBillSchema } from '@/lib/schemas';

// Function to generate sequential invoice number
const generateSequentialInvoiceNumber = async (userId: string) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const datePrefix = `INV-${year}${month}${day}`;
  
  // Get the latest invoice number for today
  const latestBill = await db
    .select({ invoiceNumber: bills.invoiceNumber })
    .from(bills)
    .where(eq(bills.userId, userId))
    .orderBy(desc(bills.createdAt))
    .limit(1);
  
  let nextSequence = 1;
  
  if (latestBill.length > 0) {
    const latestInvoiceNumber = latestBill[0].invoiceNumber;
    // Extract the sequence number from the latest invoice
    const sequenceMatch = latestInvoiceNumber.match(/-(\d{3})$/);
    if (sequenceMatch && latestInvoiceNumber.startsWith(datePrefix)) {
      // If it's from today, increment the sequence
      nextSequence = parseInt(sequenceMatch[1]) + 1;
    }
    // If it's not from today, start from 001
  }
  
  const sequenceStr = String(nextSequence).padStart(3, '0');
  return `${datePrefix}-${sequenceStr}`;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get bills with client information
    const billsList = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        invoiceNumber: bills.invoiceNumber,
        billDate: bills.billDate,
        subtotal: bills.subtotal,
        taxRate: bills.taxRate,
        tax: bills.tax,
        extraChargesTotal: bills.extraChargesTotal,
        total: bills.total,
        status: bills.status,
        notes: bills.notes,
        createdAt: bills.createdAt,
        updatedAt: bills.updatedAt,
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
      .where(eq(bills.userId, userId))
      .orderBy(desc(bills.createdAt));

    // Get items for each bill
    const billsWithItems = await Promise.all(
      billsList.map(async (bill) => {
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
            itemCostPrice: items.costPrice,
          })
          .from(billItems)
          .leftJoin(inventory, eq(billItems.inventoryId, inventory.id))
          .leftJoin(items, eq(inventory.itemId, items.id))
          .where(eq(billItems.billId, bill.id));

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
              costPrice: item.itemCostPrice,
            }
          }
        }));

        return {
          ...bill,
          items: formattedBillItems
        };
      })
    );

    return NextResponse.json(billsWithItems);

  } catch (error) {
    console.error('Bills API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
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

    // Validate the request body
    const validatedData = extendedBillSchema.parse(body);
    const { clientId, billDate, items, taxRate, extraCharges, notes, status } = validatedData;

    // Generate sequential invoice number
    const invoiceNumber = await generateSequentialInvoiceNumber(userId);

    // Calculate totals
    let subtotal = 0;
    const itemsData = [];

    // Validate inventory availability and calculate subtotal
    for (const item of items) {
      const inventoryItem = await db
        .select()
        .from(inventory)
        .where(eq(inventory.id, item.inventoryId))
        .limit(1);

      if (inventoryItem.length === 0) {
        return NextResponse.json(
          { error: `Inventory item ${item.inventoryId} not found` },
          { status: 400 }
        );
      }

      const availableQty = parseFloat(inventoryItem[0].availableQuantity);
      if (availableQty < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${availableQty}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }

      const itemTotal = item.quantity * item.sellingPrice;
      subtotal += itemTotal;

      itemsData.push({
        inventoryId: item.inventoryId,
        quantity: item.quantity.toString(),
        sellingPrice: item.sellingPrice.toString(),
        total: itemTotal.toString(),
        inventoryItem: inventoryItem[0]
      });
    }

    // Calculate extra charges total
    const extraChargesTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0);

    // Calculate tax and grand total
    const tax = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + tax + extraChargesTotal;

    // Generate bill number if not provided
    const billNumber = invoiceNumber; // Use invoice number as bill number for now

    // Create the bill
    const [newBill] = await db.insert(bills).values({
      userId,
      clientId,
      billNumber,
      invoiceNumber,
      billDate: new Date(billDate),
      subtotal: subtotal.toString(),
      taxRate: taxRate.toString(),
      tax: tax.toString(),
      extraChargesTotal: extraChargesTotal.toString(),
      total: grandTotal.toString(),
      status: status || 'due',
      notes: notes || null,
    }).returning();

    // Create bill items
    const billItemsToInsert = itemsData.map(item => ({
      billId: newBill.id,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      total: item.total,
    }));

    await db.insert(billItems).values(billItemsToInsert);

    // Create extra charges if any
    if (extraCharges.length > 0) {
      const extraChargesToInsert = extraCharges.map(charge => ({
        billId: newBill.id,
        name: charge.name,
        amount: charge.amount.toString(),
      }));

      await db.insert(billExtraCharges).values(extraChargesToInsert);
    }

    // Update inventory quantities (reduce available quantity)
    for (const item of itemsData) {
      const newAvailableQuantity = parseFloat(item.inventoryItem.availableQuantity) - parseFloat(item.quantity);
      
      await db
        .update(inventory)
        .set({ 
          availableQuantity: newAvailableQuantity.toString(),
          updatedAt: new Date()
        })
        .where(eq(inventory.id, item.inventoryId));
    }

    return NextResponse.json({
      ...newBill,
      message: 'Bill created successfully and inventory updated'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create bill error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    );
  }
} 