import jsPDF from 'jspdf';

export interface BusinessProfile {
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  billDate: string;
  dueDate?: string;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  tax: number;
  extraChargesTotal: number;
  total: number;
  notes?: string;
  status: string;
  businessProfile?: BusinessProfile;
}

export const generateInvoicePDF = (invoiceData: InvoiceData) => {
  const doc = new jsPDF();
  const black: [number, number, number] = [0, 0, 0];
  const lightGray: [number, number, number] = [240, 240, 240];
  const lightBorder: [number, number, number] = [200, 200, 200];

  // Header with invoice number and date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text(`#INVOICE : ${invoiceData.invoiceNumber}`, 20, 20);
  doc.text(`DATE: ${new Date(invoiceData.billDate).toLocaleDateString('en-GB')}`, 150, 20);

  // Billed from section (left side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Billed from :', 20, 35);
  
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceData.businessProfile?.businessName || 'YOUR BUSINESS NAME', 20, 45);
  
  doc.setFont('helvetica', 'normal');
  let leftY = 52;
  if (invoiceData.businessProfile?.email) {
    doc.text(invoiceData.businessProfile.email, 20, leftY);
    leftY += 7;
  }
  if (invoiceData.businessProfile?.phone) {
    doc.text(invoiceData.businessProfile.phone, 20, leftY);
    leftY += 7;
  }
  if (invoiceData.businessProfile?.address) {
    const addressLines = doc.splitTextToSize(invoiceData.businessProfile.address, 80);
    doc.text(addressLines, 20, leftY);
  }

  // Billed to section (right side) - RIGHT ALIGNED
  doc.text('Billed to :', 190, 35, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceData.client.name, 190, 45, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  let rightY = 52;
  if (invoiceData.client.email) {
    doc.text(invoiceData.client.email, 190, rightY, { align: 'right' });
    rightY += 7;
  }
  if (invoiceData.client.phone) {
    doc.text(invoiceData.client.phone, 190, rightY, { align: 'right' });
    rightY += 7;
  }
  if (invoiceData.client.address) {
    const addressLines = doc.splitTextToSize(invoiceData.client.address, 80);
    // For right alignment of multi-line address, we need to align each line
    addressLines.forEach((line: string, index: number) => {
      doc.text(line, 190, rightY + (index * 7), { align: 'right' });
    });
  }

  // Items table - reduced gap above table
  const tableStartY = 85;
  
  // Table header with gray background
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(20, tableStartY, 170, 10, 'F');
  
  // Table header border - lighter color
  doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
  doc.setLineWidth(0.3);
  doc.rect(20, tableStartY, 170, 10);
  
  // Table header text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text('Description', 25, tableStartY + 7);
  doc.text('Quantity', 105, tableStartY + 7);
  doc.text('Price', 135, tableStartY + 7);
  doc.text('Amount', 165, tableStartY + 7);

  // Table content
  let currentY = tableStartY + 10;
  doc.setFont('helvetica', 'normal');
  
  invoiceData.items.forEach((item) => {
    const rowHeight = 10;
    
    // Draw row border - lighter color
    doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
    doc.setLineWidth(0.3);
    doc.rect(20, currentY, 170, rowHeight);
    
    // Item details
    doc.text(item.name, 25, currentY + 7);
    doc.text(item.quantity.toFixed(1), 105, currentY + 7);
    doc.text(item.price.toFixed(1), 135, currentY + 7);
    doc.text(item.total.toFixed(1), 165, currentY + 7);
    
    currentY += rowHeight;
  });

  // Summary section
  const summaryStartY = currentY + 20;
  const summaryRightX = 170;
  
  doc.setFont('helvetica', 'normal');
  
  // Sub Total
  doc.text('Sub Total', 120, summaryStartY);
  doc.text(invoiceData.subtotal.toFixed(1), summaryRightX, summaryStartY, { align: 'right' });
  
  let summaryY = summaryStartY + 10;
  
  // Extra Charge (if any)
  if (invoiceData.extraChargesTotal > 0) {
    doc.text('Extra Charge', 120, summaryY);
    doc.text(invoiceData.extraChargesTotal.toFixed(1), summaryRightX, summaryY, { align: 'right' });
    summaryY += 10;
  }
  
  // Tax (only if tax > 0)
  if (invoiceData.tax > 0) {
    doc.text('Tax', 120, summaryY);
    doc.text(invoiceData.tax.toFixed(1), summaryRightX, summaryY, { align: 'right' });
    summaryY += 10;
  }
  
  // Draw line above total - lighter color
  doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
  doc.setLineWidth(0.3);
  doc.line(120, summaryY + 2, 190, summaryY + 2);
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 120, summaryY + 10);
  doc.text(invoiceData.total.toFixed(1), summaryRightX, summaryY + 10, { align: 'right' });

  // Signature section
  const signatureY = summaryY + 40;
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(black[0], black[1], black[2]);
  doc.setLineWidth(0.5);
  doc.line(140, signatureY, 190, signatureY);
  doc.text('Signature', 160, signatureY + 10);

  // Footer message
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('*Provide all things is in good condition and fresh*', 105, 280, { align: 'center' });

  return doc.output('arraybuffer');
};