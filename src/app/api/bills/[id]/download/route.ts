import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bills, billItems, billExtraCharges, clients, inventory, items, businessProfiles, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateInvoicePDF } from '@/lib/invoice-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let billId: string = 'unknown';
  try {
    const { id } = await params;
    billId = id;
    
    // Fetch the bill with all related data using manual joins
    const billHeader = await db
      .select({
        id: bills.id,
        invoiceNumber: bills.invoiceNumber,
        billDate: bills.billDate,
        subtotal: bills.subtotal,
        taxRate: bills.taxRate,
        tax: bills.tax,
        extraChargesTotal: bills.extraChargesTotal,
        total: bills.total,
        notes: bills.notes,
        status: bills.status,
        createdAt: bills.createdAt,
        updatedAt: bills.updatedAt,
        userId: bills.userId,
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
      .where(eq(bills.id, id))
      .limit(1);

    if (billHeader.length === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const bill = billHeader[0];

    // Fetch business profile for the user
    const [businessProfile] = await db
      .select({
        businessName: businessProfiles.businessName,
        phone: businessProfiles.phone,
        email: businessProfiles.email,
        address: businessProfiles.address,
        logo: businessProfiles.logo,
      })
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, bill.userId))
      .limit(1);

    // Get bill items with inventory information
    const billItemsResult = await db
      .select({
        id: billItems.id,
        inventoryId: billItems.inventoryId,
        quantity: billItems.quantity,
        sellingPrice: billItems.sellingPrice,
        total: billItems.total,
        itemName: items.name,
        itemSku: items.sku,
        itemUnit: items.unit,
      })
      .from(billItems)
      .leftJoin(inventory, eq(billItems.inventoryId, inventory.id))
      .leftJoin(items, eq(inventory.itemId, items.id))
      .where(eq(billItems.billId, id));

    // Get extra charges
    const extraChargesResult = await db
      .select()
      .from(billExtraCharges)
      .where(eq(billExtraCharges.billId, id));

    // Combine all data
    const fullBill = {
      ...bill,
      items: billItemsResult,
      extraCharges: extraChargesResult
    };

    // Transform bill data to invoice format
    const invoiceData = {
      invoiceNumber: fullBill.invoiceNumber,
      billDate: fullBill.billDate.toISOString().split('T')[0],
      dueDate: fullBill.billDate.toISOString().split('T')[0], // Use billDate as dueDate since bills don't have separate dueDate
      client: fullBill.client || { name: 'Unknown Client', email: null, phone: null, address: null },
      items: fullBill.items.map((item) => ({
        name: item.itemName || 'Unknown Item',
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.sellingPrice),
        total: parseFloat(item.total)
      })),
      subtotal: parseFloat(fullBill.subtotal),
      taxRate: parseFloat(fullBill.taxRate),
      tax: parseFloat(fullBill.tax),
      extraChargesTotal: parseFloat(fullBill.extraChargesTotal),
      total: parseFloat(fullBill.total),
      notes: fullBill.notes ?? undefined,
      status: fullBill.status,
      businessProfile: businessProfile ? {
        businessName: businessProfile.businessName || undefined,
        phone: businessProfile.phone || undefined,
        email: businessProfile.email || undefined,
        address: businessProfile.address || undefined,
        logo: businessProfile.logo || undefined,
      } : undefined
    };

    // Validate invoice data
    if (!invoiceData.invoiceNumber || !invoiceData.client.name || invoiceData.items.length === 0) {
      console.error('Invalid invoice data:', invoiceData);
      return NextResponse.json(
        { error: 'Invalid invoice data' },
        { status: 400 }
      );
    }

    console.log('Generating PDF for invoice:', invoiceData.invoiceNumber);

    // Generate PDF
    const pdfArrayBuffer = generateInvoicePDF(invoiceData);
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${fullBill.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download invoice API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      billId: billId || 'unknown'
    });
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
} 