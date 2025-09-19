import { csvTransactionSchema, type CSVTransaction } from "@shared/schema";

export function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  // Skip header row (assuming first row is header)
  const dataLines = lines.slice(1);
  const transactions = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    if (!line) continue;

    try {
      // Split by comma, but handle quoted values
      const columns = parseCSVLine(line);
      
      if (columns.length < 5) {
        console.warn(`Row ${i + 2}: Not enough columns (expected 5, got ${columns.length})`);
        continue;
      }

      const rawTransaction: CSVTransaction = {
        transactionDate: columns[0].trim(),
        valueDate: columns[1].trim(),
        narration: columns[2].trim(),
        debitAmount: columns[3].trim() || "0.00",
        creditAmount: columns[4].trim() || "0.00",
      };

      // Validate the transaction data
      const validatedTransaction = csvTransactionSchema.parse(rawTransaction);
      
      // Convert to the format expected by the API
      const debit = parseFloat(validatedTransaction.debitAmount) || 0;
      const credit = parseFloat(validatedTransaction.creditAmount) || 0;

      // Skip transactions where both debit and credit are 0
      if (debit === 0 && credit === 0) {
        console.warn(`Row ${i + 2}: Both debit and credit amounts are 0, skipping`);
        continue;
      }

      transactions.push({
        transactionDate: validatedTransaction.transactionDate,
        valueDate: validatedTransaction.valueDate,
        narration: validatedTransaction.narration,
        debitAmount: debit.toFixed(2),
        creditAmount: credit.toFixed(2),
      });
    } catch (error) {
      console.warn(`Row ${i + 2}: Validation error -`, error);
      continue;
    }
  }

  return transactions;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Don't forget the last field
  result.push(current);
  
  return result;
}
