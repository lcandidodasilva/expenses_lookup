import Papa from 'papaparse';
import { Transaction, MainCategory, SubCategory } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { categorizeWithGemini } from './geminiCategorizer';
import { $Enums } from '@prisma/client';

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

// Helper function to convert category names to valid enum values
function convertToValidCategoryFormat(category: string): string {
  // Remove spaces and special characters, convert "Food & Groceries" to "FoodAndGroceries"
  return category.replace(/\s+&\s+/g, 'And').replace(/\//g, '').replace(/\s+/g, '');
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

          const validTransactions: Transaction[] = [];
          const errors: string[] = [];

          // Process each row, handling errors per row
          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as Record<string, string>;
            
            try {
              // Skip empty rows
              if (Object.keys(row).length === 0 || !row[dateColumn] || !row[descriptionColumn]) {
                continue;
              }
              
              // Parse amount - handle different formats
              let amountStr = (row[amountColumn] || '0').replace(/[^0-9.,-]/g, '');
              const amount = parseFloat(amountStr.replace(',', '.'));

              if (isNaN(amount)) {
                errors.push(`Invalid amount for transaction "${row[descriptionColumn]}": ${row[amountColumn]}`);
                continue;
              }

              // Determine transaction type
              let type: 'credit' | 'debit';
              if (typeColumn && row[typeColumn]) {
                type = row[typeColumn].toLowerCase().includes('credit') ? 'credit' : 'debit';
              } else {
                type = amount >= 0 ? 'credit' : 'debit';
              }

              // Parse date with better error handling
              let parsedDate: Date;
              try {
                parsedDate = parseDate(row[dateColumn]);
              } catch (error) {
                errors.push(`Invalid date for transaction "${row[descriptionColumn]}": ${row[dateColumn]}`);
                continue;
              }

              const description = row[descriptionColumn];
              
              // Get both main category and subcategory from Gemini
              let categoryResult;
              try {
                categoryResult = await categorizeWithGemini(description, type);
              } catch (error) {
                console.error(`Error categorizing transaction: ${error}`);
                // Default to Miscellaneous if categorization fails
                categoryResult = { 
                  mainCategory: 'Miscellaneous' as MainCategory, 
                  subCategory: 'Other' as SubCategory 
                };
              }
              
              validTransactions.push({
                id: uuidv4(),
                date: parsedDate,
                description: description,
                amount: Math.abs(amount),
                type: type,
                mainCategory: categoryResult.mainCategory as MainCategory,
                subCategory: categoryResult.subCategory as SubCategory,
                account: accountColumn && row[accountColumn] ? row[accountColumn] : 'Unknown',
                counterparty: counterpartyColumn && row[counterpartyColumn] ? row[counterpartyColumn] : null,
                notes: notesColumn && row[notesColumn] ? row[notesColumn] : null,
              });
            } catch (rowError: any) {
              const rowNum = i + 2; // Add 2 because of 0-indexing and header row
              errors.push(`Error processing row ${rowNum}: ${rowError.message}`);
            }
          }

          if (errors.length > 0) {
            console.warn(`CSV parsing completed with ${errors.length} errors out of ${results.data.length} rows.`);
            if (errors.length <= 10) {
              errors.forEach(error => console.warn(error));
            } else {
              console.warn(`First 10 errors: ${errors.slice(0, 10).join('\n')}`);
            }
          }

          if (validTransactions.length === 0 && results.data.length > 0) {
            throw new Error(`No valid transactions found in CSV file. Found ${errors.length} errors.`);
          }

          resolve(validTransactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
};

function parseDate(dateStr: string): Date {
  // Handle empty or null date strings
  if (!dateStr || dateStr.trim() === '') {
    throw new Error('Date is required but was empty');
  }

  // First, try to normalize date format
  const cleanedDateStr = dateStr.trim().replace(/\s+/g, ' ');
  
  // Try different date formats
  const formats = [
    // YYYYMMDD
    /^(\d{4})(\d{2})(\d{2})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // MM/DD/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/,
    // MM-DD-YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/
  ];

  for (const format of formats) {
    const match = cleanedDateStr.match(format);
    if (match) {
      const [_, part1, part2, part3] = match;
      
      // YYYY-MM-DD or YYYYMMDD format
      if (part1.length === 4) {
        const year = parseInt(part1);
        const month = parseInt(part2) - 1; // JS months are 0-based
        const day = parseInt(part3);
        
        // Validate month and day
        if (month < 0 || month > 11) throw new Error(`Invalid month: ${month + 1}`);
        if (day < 1 || day > 31) throw new Error(`Invalid day: ${day}`);
        
        const date = new Date(year, month, day);
        
        // Check if date is valid (this handles edge cases like Feb 30)
        if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
          throw new Error(`Invalid date: ${dateStr} (resolved to ${date.toISOString()})`);
        }
        
        return date;
      }
      // DD/MM/YYYY or DD-MM-YYYY format (European format)
      else if (cleanedDateStr.includes('/') || cleanedDateStr.includes('-')) {
        const day = parseInt(part1);
        const month = parseInt(part2) - 1; // JS months are 0-based
        const year = parseInt(part3);
        
        // Validate month and day
        if (month < 0 || month > 11) throw new Error(`Invalid month: ${month + 1}`);
        if (day < 1 || day > 31) throw new Error(`Invalid day: ${day}`);
        
        const date = new Date(year, month, day);
        
        // Check if date is valid (this handles edge cases like Feb 30)
        if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
          throw new Error(`Invalid date: ${dateStr} (resolved to ${date.toISOString()})`);
        }
        
        return date;
      }
    }
  }

  // Try to handle dates with month names (e.g., "15 Jan 2023" or "Jan 15, 2023")
  const monthNameMatch = cleanedDateStr.match(/(\d{1,2})[- ]([A-Za-z]{3,9})[- ](\d{4})|([A-Za-z]{3,9})[- ](\d{1,2})[, ]+(\d{4})/);
  if (monthNameMatch) {
    // Extract the components based on the pattern matched
    const isFormatDayMonthYear = monthNameMatch[1] !== undefined;
    
    let day, monthName, year;
    
    if (isFormatDayMonthYear) {
      day = parseInt(monthNameMatch[1]);
      monthName = monthNameMatch[2].toLowerCase();
      year = parseInt(monthNameMatch[3]);
    } else {
      monthName = monthNameMatch[4].toLowerCase();
      day = parseInt(monthNameMatch[5]);
      year = parseInt(monthNameMatch[6]);
    }
    
    // Map month names to month numbers (0-based)
    const monthMap: Record<string, number> = {
      'jan': 0, 'january': 0,
      'feb': 1, 'february': 1,
      'mar': 2, 'march': 2,
      'apr': 3, 'april': 3,
      'may': 4,
      'jun': 5, 'june': 5,
      'jul': 6, 'july': 6,
      'aug': 7, 'august': 7,
      'sep': 8, 'september': 8,
      'oct': 9, 'october': 9,
      'nov': 10, 'november': 10,
      'dec': 11, 'december': 11
    };
    
    const month = monthMap[monthName];
    
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      // Validate day
      if (day < 1 || day > 31) throw new Error(`Invalid day: ${day}`);
      
      const date = new Date(year, month, day);
      
      // Check if date is valid
      if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        throw new Error(`Invalid date: ${dateStr} (resolved to ${date.toISOString()})`);
      }
      
      return date;
    }
  }

  // Last resort: try JavaScript's built-in date parsing
  const date = new Date(cleanedDateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  throw new Error(`Unable to parse date: ${dateStr}`);
}