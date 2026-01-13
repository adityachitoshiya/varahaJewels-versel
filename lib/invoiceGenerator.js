import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (orderData) => {
  console.log('📄 Starting invoice generation...', orderData);

  if (!orderData) {
    console.error('❌ Order data is missing');
    throw new Error('Order data is required');
  }

  // Check if jsPDF is available
  if (typeof window === 'undefined') {
    console.error('❌ Running on server side, jsPDF requires browser');
    throw new Error('PDF generation only works in browser');
  }

  try {
    // 1. Data Normalization
    const customer = {
      name: orderData.customer?.name || orderData.customer_name || orderData.name || 'Valued Customer',
      email: orderData.customer?.email || orderData.email || '',
      contact: orderData.customer?.contact || orderData.phone || '',
      address: orderData.customer?.address || orderData.address || '',
      city: orderData.city || '',
      pincode: orderData.pincode || ''
    };

    // Handle items
    let items = [];
    if (Array.isArray(orderData.items)) {
      items = orderData.items;
    } else if (typeof orderData.items_json === 'string') {
      try {
        items = JSON.parse(orderData.items_json);
      } catch (e) {
        console.error('Error parsing items_json:', e);
        items = [];
      }
    }

    // Amount Calculations
    // Priority: total_amount (API standard) -> amount (prop override) -> 0
    const totalAmount = orderData.total_amount !== undefined ? orderData.total_amount : (orderData.amount || 0);

    // Calculate Subtotal from items
    // Use price and quantity from items if available
    const calculatedSubtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

    // Discount Logic
    const discount = orderData.discount || {};
    const discountAmount = discount.discountAmount || 0;

    // Fallback for subtotal if items calculation is 0 (e.g. legacy data) but total exists
    // If calculated > 0, use it. Else use total + discount as rough estimate.
    const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (totalAmount + discountAmount);

    // Calculate Shipping/Handling/COD differences
    // Expected equation: Subtotal - Discount + Shipping = Total
    // So: Shipping = Total - (Subtotal - Discount)
    const impliedShipping = totalAmount - (subtotal - discountAmount);
    // Use the max of 0 and implied to avoid negative shipping (which would mean math mismatch)
    const shippingCharge = Math.max(0, impliedShipping);

    console.log('💰 Pricing:', { subtotal, discountAmount, shippingCharge, finalAmount: totalAmount });

    const doc = new jsPDF();

    // Set colors
    const primaryColor = [122, 59, 35]; // Heritage Brown
    const copperColor = [163, 86, 42]; // Copper

    // Logo/Header Section
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('VARAHA JEWELS', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Crafting Heritage Since Generations', 105, 28, { align: 'center' });

    // Invoice Title
    doc.setTextColor(...primaryColor);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 52, { align: 'center' });

    // Invoice Details Box
    const invoiceY = 62;
    doc.setDrawColor(...copperColor);
    doc.setLineWidth(0.5);
    doc.rect(15, invoiceY, 180, 25);

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'normal');

    // Left side - Order details
    const invoiceNumber = orderData.orderId || orderData.order_id || orderData.id || `ORD-${Date.now()}`;
    doc.text(`Invoice No: ${invoiceNumber}`, 20, invoiceY + 8);

    const paymentRef = orderData.paymentId || (orderData.payment_method === 'cod' ? 'Cash on Delivery' : 'N/A');
    doc.text(`Payment ID: ${paymentRef}`, 20, invoiceY + 14);

    const createdDate = orderData.createdAt || orderData.created_at || Date.now();
    doc.text(`Invoice Date: ${new Date(createdDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}`, 20, invoiceY + 20);

    // Right side - Status
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34);
    const status = orderData.status || 'PAID';
    doc.text(status.toUpperCase(), 175, invoiceY + 12, { align: 'right' });

    // Customer Details Section
    const customerY = 95;
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 15, customerY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(customer.name, 15, customerY + 8);
    doc.text(customer.email, 15, customerY + 14);
    doc.text(customer.contact, 15, customerY + 20);

    let addressText = customer.address;
    if (customer.city) addressText += `, ${customer.city}`;
    if (customer.pincode) addressText += ` - ${customer.pincode}`;

    if (addressText) {
      const addressLines = doc.splitTextToSize(addressText, 80);
      doc.text(addressLines, 15, customerY + 26);
    }

    // Product Table
    const tableY = customerY + 45;

    // Map items to table rows
    const tableRows = items.map(item => [
      item.productName || item.name || 'Product',
      item.variantId || '-',
      (item.quantity || 1).toString(),
      `₹${(item.price || 0).toLocaleString('en-IN')}`,
      `₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}`
    ]);

    // If no items (fallback)
    if (items.length === 0) {
      tableRows.push([
        orderData.productName || 'Product',
        '-',
        '1',
        `₹${subtotal.toLocaleString('en-IN')}`,
        `₹${subtotal.toLocaleString('en-IN')}`
      ]);
    }

    autoTable(doc, {
      startY: tableY,
      head: [['Item', 'Variant ID', 'Quantity', 'Unit Price', 'Amount']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: [60, 60, 60],
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });

    // Summary Section
    const summaryY = doc.lastAutoTable.finalY + 10;
    const summaryX = 130;

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'normal');

    // Subtotal
    doc.text('Subtotal:', summaryX, summaryY);
    doc.text(`₹${subtotal.toLocaleString('en-IN')}`, 190, summaryY, { align: 'right' });

    // Discount
    if (discountAmount > 0) {
      doc.setTextColor(34, 139, 34);
      doc.text(`Discount${discount.couponCode ? ' (' + discount.couponCode + ')' : ''}:`, summaryX, summaryY + 6);
      doc.text(`-₹${discountAmount.toLocaleString('en-IN')}`, 190, summaryY + 6, { align: 'right' });
    }

    // Tax
    doc.setTextColor(80);
    doc.text('Tax (Included):', summaryX, summaryY + 12);
    doc.text('₹0', 190, summaryY + 12, { align: 'right' });

    // Shipping / Handling
    // If we have a positive discrepancy, it's shipping/processing logic
    doc.setTextColor(34, 139, 34);
    if (shippingCharge > 0) {
      doc.text('Shipping & Handling:', summaryX, summaryY + 18);
      doc.text(`₹${shippingCharge.toLocaleString('en-IN')}`, 190, summaryY + 18, { align: 'right' });
    } else {
      doc.text('Shipping:', summaryX, summaryY + 18);
      doc.text('FREE', 190, summaryY + 18, { align: 'right' });
    }

    // Total Line
    doc.setDrawColor(...copperColor);
    doc.setLineWidth(0.3);
    doc.line(summaryX, summaryY + 22, 190, summaryY + 22);

    // Grand Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('TOTAL:', summaryX, summaryY + 30);
    doc.setTextColor(...copperColor);
    doc.setFontSize(14);
    doc.text(`₹${totalAmount.toLocaleString('en-IN')}`, 190, summaryY + 30, { align: 'right' });

    // Payment Status Badge
    doc.setFillColor(34, 139, 34);
    doc.roundedRect(summaryX, summaryY + 35, 60, 8, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIVED', summaryX + 30, summaryY + 40, { align: 'center' });

    // Notes Section
    const notesY = summaryY + 55;
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 15, notesY);

    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'normal');
    doc.text('• All products are BIS hallmarked and come with authenticity certificate', 15, notesY + 6);
    doc.text('• 30-day return policy applicable on all purchases', 15, notesY + 11);
    doc.text('• For any queries, contact us at support@varahajewels.com', 15, notesY + 16);

    // Footer
    const footerY = 275;
    doc.setDrawColor(...copperColor);
    doc.setLineWidth(0.3);
    doc.line(15, footerY, 195, footerY);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Thank you for choosing Varaha Jewels!', 105, footerY + 5, { align: 'center' });
    doc.text('www.varahajewels.com | +91-XXXXXXXXXX | support@varahajewels.com', 105, footerY + 10, { align: 'center' });

    // Save the PDF
    const orderIdForFile = (invoiceNumber || 'Invoice').toString().replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Varaha_Invoice_${orderIdForFile}.pdf`;
    console.log('💾 Saving invoice as:', fileName);
    doc.save(fileName);

    console.log('✅ Invoice download triggered successfully');
    return fileName;

  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};
