import Papa from 'papaparse';
import { Transaction } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { categorizeWithGemini } from './geminiCategorizer';

const COLUMN_MAPPINGS = {
  date: ['Date', 'date', 'DATE', 'Transaction Date', 'transaction_date'],
  description: ['Name / Description', 'Description', 'description', 'DESCRIPTION', 'Transaction Description'],
  amount: ['Amount (EUR)', 'Amount', 'amount', 'AMOUNT', 'Transaction Amount'],
  type: ['Debit/credit', 'Type', 'type', 'TYPE', 'Transaction Type'],
  account: ['Account', 'account', 'ACCOUNT', 'Account Number'],
  counterparty: ['Counterparty', 'counterparty', 'COUNTERPARTY', 'Payee'],
  notes: ['Notifications', 'notes', 'NOTES', 'Memo']
};

function findColumnName(headers: string[], possibleNames: string[]): string | null {
  return possibleNames.find(name => headers.includes(name)) || null;
}

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const headers = Object.keys(results.data[0] || {});
          
          // Find the correct column names
          const dateColumn = findColumnName(headers, COLUMN_MAPPINGS.date);
          const descriptionColumn = findColumnName(headers, COLUMN_MAPPINGS.description);
          const amountColumn = findColumnName(headers, COLUMN_MAPPINGS.amount);
          const typeColumn = findColumnName(headers, COLUMN_MAPPINGS.type);
          const accountColumn = findColumnName(headers, COLUMN_MAPPINGS.account);
          const counterpartyColumn = findColumnName(headers, COLUMN_MAPPINGS.counterparty);
          const notesColumn = findColumnName(headers, COLUMN_MAPPINGS.notes);

          if (!dateColumn || !descriptionColumn || !amountColumn) {
            throw new Error('Required columns not found in CSV file. Please ensure your file has Date, Description, and Amount columns.');
          }

          const transactions: Transaction[] = await Promise.all(
            results.data.map(async (row: any) => {
              // Parse amount - handle different formats
              let amountStr = row[amountColumn].toString().replace(/[^0-9.,-]/g, '');
              const amount = parseFloat(amountStr.replace(',', '.'));

              // Determine transaction type
              let type: 'credit' | 'debit';
              if (typeColumn) {
                type = row[typeColumn].toLowerCase().includes('credit') ? 'credit' : 'debit';
              } else {
                type = amount >= 0 ? 'credit' : 'debit';
              }

              const description = row[descriptionColumn];
              // Get both main category and subcategory from Gemini
              const { mainCategory, subCategory } = await categorizeWithGemini(description);
              
              return {
                id: uuidv4(),
                date: parseDate(row[dateColumn]),
                description: description,
                amount: Math.abs(amount),
                type: type,
                mainCategory: mainCategory,
                subCategory: subCategory,
                account: accountColumn ? row[accountColumn] : 'Unknown',
                counterparty: counterpartyColumn ? row[counterpartyColumn] : null,
                notes: notesColumn ? row[notesColumn] : null,
              };
            })
          );
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

function parseDate(dateStr: string): Date {
  // Try different date formats
  const formats = [
    // YYYYMMDD
    /^(\d{4})(\d{2})(\d{2})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // MM/DD/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const [_, year, month, day] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }

  // If no format matches, try parsing directly
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return date;
} 