import { jsPDF } from 'jspdf';
import type { AccountSetup, Transaction } from "@shared/schema";

export async function generatePDF(setup: AccountSetup, transactions: Transaction[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  let yPosition = margin;

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateForFilename = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const addText = (text: string, x: number, fontSize: number = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, x, yPosition);
  };

  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(30, 64, 175); // Primary color
    doc.setLineWidth(0.5);
    doc.line(x1, y1, x2, y2);
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header with businessONLINE and Emirates NBD styling
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 49, 130); // Dark blue for businessONLINE
  doc.text('business', margin, yPosition);
  
  // Get text width for businessONLINE positioning
  const businessWidth = doc.getTextWidth('business');
  doc.setTextColor(240, 103, 33); // Orange for ONLINE
  doc.text('ONLINE', margin + businessWidth, yPosition);

  // Emirates NBD on right side with background
  const embWidth = doc.getTextWidth('Emirates NBD');
  const embX = pageWidth - margin - embWidth - 8;
  doc.setFillColor(28, 49, 130); // Emirates NBD blue
  doc.roundedRect(embX - 4, yPosition - 8, embWidth + 8, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255); // White text
  doc.text('Emirates NBD', embX, yPosition);
  yPosition += 10;

  // Header line
  doc.setDrawColor(28, 49, 130); // Navy blue line
  doc.setLineWidth(2);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 49, 130); // Navy blue for title
  doc.text('Account Statement', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Generated date and user info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100); // Gray color
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const userName = setup.accountName.toUpperCase();
  doc.text(`Generated ${currentDate} by ${userName}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 25;

  // Account Information - styled exactly like Emirates NBD
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 49, 130); // Navy blue
  doc.text('Account Information', margin, yPosition);
  yPosition += 12;

  // Add separator line
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(1);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 12;

  const accountInfoLeft = [
    ['Account Number', setup.accountNumber],
    ['Currency', setup.currency],
    ['Account Type', setup.accountType],
    ['Registered Address', setup.address],
  ];

  const accountInfoRight = [
    ['Account Name', setup.accountName.toUpperCase()],
    ['Country', setup.country.toUpperCase()],
    ['BIC Code', 'EBILEADXXX'],
    ['IBAN', setup.iban],
  ];

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120); // Gray color for labels
  
  // Left column
  const leftStartY = yPosition;
  accountInfoLeft.forEach(([label, value], index) => {
    const currentY = leftStartY + (index * 16);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black for values
    doc.text(value, margin + 55, currentY);
    doc.setTextColor(120, 120, 120);
  });

  // Right column - positioned better
  const rightStart = pageWidth / 2 + 5;
  accountInfoRight.forEach(([label, value], index) => {
    const currentY = leftStartY + (index * 16);
    doc.setFont('helvetica', 'normal');
    doc.text(label, rightStart, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(value, rightStart + 55, currentY);
    doc.setTextColor(120, 120, 120);
  });

  yPosition += 70;

  // Balance Information - styled exactly like Emirates NBD
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 49, 130); // Navy blue
  doc.text('Balance Information', margin, yPosition);
  yPosition += 12;

  // Add separator line
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(1);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 12;

  const balanceInfoLeft = [
    ['Current Balance', formatCurrency(setup.currentBalance)],
    ['Uncleared Balance', '0.00'],
    ['Account Status', 'Active'],
    ['Mailing Address', '--'],
  ];

  const balanceInfoRight = [
    ['Effective Available Balance', formatCurrency(setup.availableBalance)],
    ['Tax Registration Number', '--'],
    ['', ''], // Empty row for alignment
    ['', ''], // Empty row for alignment
  ];

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120); // Gray color for labels

  // Left column
  const balanceLeftStartY = yPosition;
  balanceInfoLeft.forEach(([label, value], index) => {
    const currentY = balanceLeftStartY + (index * 16);
    if (label) {
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin, currentY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(value, margin + 55, currentY);
      doc.setTextColor(120, 120, 120);
    }
  });

  // Right column
  balanceInfoRight.forEach(([label, value], index) => {
    const currentY = balanceLeftStartY + (index * 16);
    if (label) {
      doc.setFont('helvetica', 'normal');
      doc.text(label, rightStart, currentY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(value, rightStart + 55, currentY);
      doc.setTextColor(120, 120, 120);
    }
  });

  yPosition += 70;

  // Account Statement Section - styled exactly like Emirates NBD
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 49, 130); // Navy blue
  doc.text('Account Statement', margin, yPosition);
  doc.setTextColor(120, 120, 120); // Gray for record count
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Records: ${transactions.length}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 12;

  // Add separator line
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(1);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`From: ${formatDate(setup.fromDate)} to ${formatDate(setup.toDate)}`, margin, yPosition);
  yPosition += 15;

  // Transactions table
  if (transactions.length > 0) {
    // Table headers
    const headers = ['Date', 'Value Date', 'Narration', 'Debit', 'Credit', 'Balance'];
    // Adjust column widths to fit within contentWidth (~170)
    const colWidths = [20, 20, 70, 20, 20, 20]; // Total = 170, fits within contentWidth
    const colPositions = colWidths.reduce((acc, width, i) => {
      acc.push(i === 0 ? margin : acc[i - 1] + colWidths[i - 1]);
      return acc;
    }, [] as number[]);

    const drawTableHeader = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      // Draw header background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition - 2, contentWidth, 8, 'F');
      
      headers.forEach((header, i) => {
        if (i >= 3) {
          doc.text(header, colPositions[i] + colWidths[i] - 2, yPosition + 3, { align: 'right' });
        } else {
          doc.text(header, colPositions[i] + 2, yPosition + 3);
        }
      });
      
      yPosition += 10;
      
      // Table border
      addLine(margin, yPosition - 6, pageWidth - margin, yPosition - 6);
    };

    // Draw initial table header
    drawTableHeader();

    // Transaction rows
    doc.setFont('helvetica', 'normal');
    transactions.forEach((transaction, index) => {
      const isNewPage = checkPageBreak(8);
      if (isNewPage) {
        drawTableHeader(); // Redraw header on new page
      }
      
      const rowData = [
        formatDate(transaction.transactionDate),
        formatDate(transaction.valueDate),
        transaction.narration.length > 35 ? transaction.narration.substring(0, 32) + '...' : transaction.narration,
        parseFloat(transaction.debitAmount) > 0 ? formatCurrency(transaction.debitAmount) : '0.00',
        parseFloat(transaction.creditAmount) > 0 ? formatCurrency(transaction.creditAmount) : '0.00',
        formatCurrency(transaction.runningBalance || '0'),
      ];

      rowData.forEach((data, i) => {
        if (i >= 3) {
          doc.text(data, colPositions[i] + colWidths[i] - 2, yPosition, { align: 'right' });
        } else {
          doc.text(data, colPositions[i] + 2, yPosition);
        }
      });

      yPosition += 6;
      
      // Add subtle row separator
      if (index < transactions.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
      }
      
      yPosition += 2;
    });
    
    // Table bottom border
    addLine(margin, yPosition, pageWidth - margin, yPosition);
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No transactions found for the selected period.', pageWidth / 2, yPosition, { align: 'center' });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Save the PDF
  const fileName = `Account_Statement_${setup.accountNumber}_${formatDateForFilename(setup.fromDate)}_to_${formatDateForFilename(setup.toDate)}.pdf`;
  doc.save(fileName);
}
