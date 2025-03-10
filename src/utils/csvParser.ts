import Papa from 'papaparse';
import { Transaction, CategoryName } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { categorizeThroughGPT } from './gptCategorizer';

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
              const category = await categorizeThroughGPT(description);
              
              return {
                id: uuidv4(),
                date: parseDate(row[dateColumn]),
                description: description,
                amount: Math.abs(amount),
                type: type,
                category: category,
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

const detectCategory = (description: string): TransactionCategory => {
  description = description.toLowerCase();
  
  if (description.match(/salary|payroll|deposit/)) return 'Income';
  if (description.match(/rent|mortgage|housing/)) return 'Housing';
  if (description.match(/uber|lyft|gas|parking|transit/)) return 'Transportation';
  if (description.match(/restaurant|grocery|food|meal/)) return 'Food';
  if (description.match(/electricity|water|internet|phone/)) return 'Utilities';
  if (description.match(/insurance/)) return 'Insurance';
  if (description.match(/doctor|hospital|pharmacy|medical/)) return 'Healthcare';
  if (description.match(/netflix|spotify|movie|entertainment/)) return 'Entertainment';
  if (description.match(/amazon|walmart|target|shopping/)) return 'Shopping';
  
  return 'Other';
}; 