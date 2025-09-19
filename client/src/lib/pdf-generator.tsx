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

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(setup.serviceName, margin, yPosition);
  doc.text(setup.bankName, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 10;

  // Header line
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Statement', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('en-GB');
  doc.text(`Generated ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Account Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Information', margin, yPosition);
  yPosition += 10;

  const accountInfo = [
    ['Account Number', setup.accountNumber],
    ['Account Name', setup.accountName],
    ['Currency', setup.currency],
    ['Country', setup.country],
    ['Account Type', setup.accountType],
    ['IBAN', setup.iban],
    ['Registered Address', setup.address],
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  accountInfo.forEach(([label, value]) => {
    doc.text(label + ':', margin, yPosition);
    doc.text(value, margin + 50, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Balance Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Balance Information', margin, yPosition);
  yPosition += 10;

  const balanceInfo = [
    ['Current Balance', formatCurrency(setup.currentBalance)],
    ['Effective Available Balance', formatCurrency(setup.availableBalance)],
    ['Uncleared Balance', '0.00'],
    ['Account Status', 'Active'],
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  balanceInfo.forEach(([label, value]) => {
    doc.text(label + ':', margin, yPosition);
    doc.text(value, margin + 50, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Statement Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Statement', margin, yPosition);
  doc.text(`Total Records: ${transactions.length}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
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
