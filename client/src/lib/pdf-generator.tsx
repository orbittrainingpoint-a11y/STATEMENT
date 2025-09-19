import { jsPDF } from 'jspdf';
import type { AccountSetup, Transaction } from "@shared/schema";

export async function generatePDF(setup: AccountSetup, transactions: Transaction[]) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
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

  const ensureSpace = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Derive actual statement period from transactions
  const sortedTransactions = transactions.length > 0 
    ? [...transactions].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
    : [];
  const actualFromDate = sortedTransactions.length > 0 ? sortedTransactions[0].transactionDate : setup.fromDate;
  const actualToDate = sortedTransactions.length > 0 ? sortedTransactions[sortedTransactions.length - 1].transactionDate : setup.toDate;

  // Header - Match reference PDF exactly
  yPosition += 40; // More space at top
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Black color
  doc.text('Account Statement', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Generated date and user info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0); // Black color
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const userName = setup.accountName.toUpperCase();
  doc.text(`Generated ${currentDate} by ${userName}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 25;

  // Account Information - Match reference PDF format
  ensureSpace(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Account Information', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Row 1: Account Number and Account Name
  doc.text('Account Number', margin, yPosition);
  doc.text(setup.accountNumber, margin + 60, yPosition);
  doc.text('Account Name', pageWidth / 2, yPosition);
  doc.text(setup.accountName.toUpperCase(), pageWidth / 2 + 60, yPosition);
  yPosition += 12;
  
  // Continue Account Name if long
  if (setup.accountName.length > 25) {
    yPosition += 6;
  }

  // Row 2: Currency and Country  
  doc.text('Currency', margin, yPosition);
  doc.text(setup.currency, margin + 60, yPosition);
  doc.text('Country', pageWidth / 2, yPosition);
  doc.text(setup.country.toUpperCase(), pageWidth / 2 + 60, yPosition);
  yPosition += 12;

  // Row 3: Account Type and BIC Code
  doc.text('Account Type', margin, yPosition);
  doc.text(setup.accountType.toUpperCase(), margin + 60, yPosition);
  doc.text('BIC Code', pageWidth / 2, yPosition);
  doc.text('EBILAEADXXX', pageWidth / 2 + 60, yPosition);
  yPosition += 12;

  // Row 4: Registered Address and IBAN
  doc.text('Registered Address', margin, yPosition);
  const addressLines = doc.splitTextToSize(setup.address, 80);
  addressLines.forEach((line: string, index: number) => {
    doc.text(line, margin + 60, yPosition + (index * 6));
  });
  doc.text('IBAN', pageWidth / 2, yPosition);
  doc.text(setup.iban, pageWidth / 2 + 60, yPosition);
  yPosition += Math.max(12, addressLines.length * 6);
  yPosition += 10;

  // Balance Information - Match reference PDF format
  ensureSpace(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Balance Information', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Row 1: Current Balance and Effective Available Balance
  doc.text('Current Balance', margin, yPosition);
  doc.text(formatCurrency(setup.currentBalance), margin + 60, yPosition);
  doc.text('Effective Available', pageWidth / 2, yPosition);
  doc.text(formatCurrency(setup.availableBalance), pageWidth / 2 + 60, yPosition);
  yPosition += 6;
  doc.text('Balance', pageWidth / 2 + 60, yPosition);
  yPosition += 8;

  // Row 2: Uncleared Balance and Tax Registration Number
  doc.text('Uncleared Balance', margin, yPosition);
  doc.text('0.00', margin + 60, yPosition);
  doc.text('Tax Registration', pageWidth / 2, yPosition);
  doc.text('--', pageWidth / 2 + 60, yPosition);
  yPosition += 6;
  doc.text('Number', pageWidth / 2, yPosition);
  yPosition += 8;

  // Row 3: Account Status
  doc.text('Account Status', margin, yPosition);
  doc.text('Active', margin + 60, yPosition);
  yPosition += 8;

  // Row 4: Mailing Address
  doc.text('Mailing Address', margin, yPosition);
  doc.text('--', margin + 60, yPosition);
  yPosition += 15;

  // Account Statement Section - Match reference PDF format
  ensureSpace(50);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Account Statement', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Records: ${transactions.length}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`From: ${formatDate(actualFromDate)} to ${formatDate(actualToDate)}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Transactions table
  if (transactions.length > 0) {
    // Table headers - Match reference PDF format exactly
    const headers = ['Transaction', 'Value Date', 'Narration', 'Debit', 'Credit', 'Running'];
    const headers2 = ['Date', '', '', '', '', 'Balance'];
    // Column widths matching reference PDF layout
    const colWidths = [20, 20, 90, 25, 25, 25]; // Total fits A4 width
    const colPositions = colWidths.reduce((acc, width, i) => {
      acc.push(i === 0 ? margin : acc[i - 1] + colWidths[i - 1]);
      return acc;
    }, [] as number[]);

    const drawTableHeader = () => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      
      // Draw first header row
      headers.forEach((header, i) => {
        if (i >= 3) {
          doc.text(header, colPositions[i] + colWidths[i] - 2, yPosition, { align: 'right' });
        } else {
          doc.text(header, colPositions[i] + 2, yPosition);
        }
      });
      yPosition += 6;
      
      // Draw second header row for multi-line headers
      headers2.forEach((header, i) => {
        if (header && i >= 3) {
          doc.text(header, colPositions[i] + colWidths[i] - 2, yPosition, { align: 'right' });
        } else if (header) {
          doc.text(header, colPositions[i] + 2, yPosition);
        }
      });
      yPosition += 8;
      
      // Table border
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 3;
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
      
      // Handle dynamic narration wrapping - match reference format
      const maxNarrationWidth = colWidths[2] - 4;
      const narrationLines = doc.splitTextToSize(transaction.narration, maxNarrationWidth);
      
      // Use running balance from API response or calculate
      const runningBalanceValue = transaction.runningBalance || '0';
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Draw transaction data
      doc.text(formatDate(transaction.transactionDate), colPositions[0] + 2, yPosition);
      doc.text(formatDate(transaction.valueDate), colPositions[1] + 2, yPosition);
      
      // Draw narration lines
      narrationLines.forEach((line: string, lineIndex: number) => {
        doc.text(line, colPositions[2] + 2, yPosition + (lineIndex * 4));
      });
      
      // Draw amounts - right aligned
      const debitAmount = parseFloat(transaction.debitAmount) > 0 ? formatCurrency(transaction.debitAmount) : '0.00';
      const creditAmount = parseFloat(transaction.creditAmount) > 0 ? formatCurrency(transaction.creditAmount) : '0.00';
      
      doc.text(debitAmount, colPositions[3] + colWidths[3] - 2, yPosition, { align: 'right' });
      doc.text(creditAmount, colPositions[4] + colWidths[4] - 2, yPosition, { align: 'right' });
      doc.text(formatCurrency(runningBalanceValue), colPositions[5] + colWidths[5] - 2, yPosition, { align: 'right' });
      
      // Calculate row height based on narration lines
      const rowHeight = Math.max(8, narrationLines.length * 4 + 4);
      yPosition += rowHeight;
      
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

  // Footer - Match reference PDF format
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Page ${i}      of ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
  }

  // Save the PDF with actual transaction dates
  const fileName = `Account_Statement_${setup.accountNumber}_${formatDateForFilename(actualFromDate)}_to_${formatDateForFilename(actualToDate)}.pdf`;
  doc.save(fileName);
}
