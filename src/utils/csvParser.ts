import Papa from 'papaparse';
import { Transaction, CategoryName } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { categorizeThroughGPT } from './gptCategorizer';

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const transactions: Transaction[] = await Promise.all(
            results.data.map(async (row: any) => {
              const amount = parseFloat(row['Amount (EUR)'].replace(',', '.'));
              const description = row['Name / Description'];
              const category = await categorizeThroughGPT(description);
              
              return {
                id: uuidv4(),
                date: parseDate(row['Date']),
                description: description,
                amount: Math.abs(amount),
                type: row['Debit/credit'].toLowerCase() === 'credit' ? 'credit' : 'debit',
                category: category,
                account: row['Account'],
                counterparty: row['Counterparty'] || null,
                notes: row['Notifications'] || null,
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
  // Input format: "YYYYMMDD"
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // Months are 0-based
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
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