import { parseCSV } from '@/utils/csvParser';

// Mock the geminiCategorizer module
jest.mock('@/utils/geminiCategorizer', () => ({
  categorizeWithGemini: jest.fn().mockResolvedValue({
    mainCategory: 'Housing',
    subCategory: 'Rent'
  }),
}));

// Mock UUID generation
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

// Mock the File API
interface MockFileOptions {
  type?: string;
}

class MockFile {
  name: string;
  type: string;
  data: string;

  constructor(data: string[], name: string, options: MockFileOptions = {}) {
    this.name = name;
    this.type = options.type || 'text/plain';
    this.data = data.join('\n');
  }

  text(): Promise<string> {
    return Promise.resolve(this.data);
  }
}

// Use type assertion to override the global File
(global as any).File = MockFile;

// Mock Papa parse
interface ParseResults {
  data: Record<string, string>[];
  errors: any[];
  meta: { aborted: boolean };
}

interface ParseOptions {
  header: boolean;
  skipEmptyLines: boolean;
  complete: (results: ParseResults) => void;
  error: (error: Error) => void;
}

jest.mock('papaparse', () => ({
  parse: (file: MockFile, options: ParseOptions) => {
    // Simple CSV parsing simulation
    const lines = file.data.split('\n');
    const headers = lines[0].split(',');

    const results: ParseResults = {
      data: lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, string> = {};
        headers.forEach((header: string, i: number) => {
          row[header.trim()] = values[i]?.trim() || '';
        });
        return row;
      }),
      errors: [],
      meta: { aborted: false }
    };

    // Call the complete function with the results
    setTimeout(() => options.complete(results), 0);
  }
}));

describe('csvParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCSV', () => {
    it('should parse CSV data with standard headers', async () => {
      const csvData = [
        'Date,Description,Amount,Type,Account,Counterparty,Notes',
        '2023-01-15,Rent Payment,1000,debit,Checking,LANDLORD,Monthly rent'
      ];
      
      const file = new MockFile(csvData, 'transactions.csv');
      
      const result = await parseCSV(file as unknown as File);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'mock-uuid',
        date: expect.any(Date),
        description: 'Rent Payment',
        amount: 1000,
        type: 'debit',
        account: 'Checking',
        counterparty: 'LANDLORD',
        notes: 'Monthly rent',
        mainCategory: 'Housing',
        subCategory: 'Rent'
      }));
      
      expect(categorizeWithGemini).toHaveBeenCalledWith('Rent Payment');
    });
    
    it('should handle alternative column names', async () => {
      const csvData = [
        'Transaction Date,Transaction Description,Transaction Amount,Transaction Type',
        '2023-01-15,Grocery Shopping,75.50,debit'
      ];
      
      const file = new MockFile(csvData, 'transactions.csv');
      
      const result = await parseCSV(file as unknown as File);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        description: 'Grocery Shopping',
        amount: 75.5,
        type: 'debit',
        account: 'Unknown' // Default value when not provided
      }));
    });
    
    it('should handle amount formatting correctly', async () => {
      const csvData = [
        'Date,Description,Amount',
        '2023-01-15,Test Transaction,$1,234.56'
      ];
      
      const file = new MockFile(csvData, 'transactions.csv');
      
      const result = await parseCSV(file as unknown as File);
      
      expect(result[0]).toEqual(expect.objectContaining({
        amount: 1234.56
      }));
    });
    
    it('should infer transaction type from amount when not provided', async () => {
      const csvData = [
        'Date,Description,Amount',
        '2023-01-15,Income,500',
        '2023-01-16,Expense,-100'
      ];
      
      const file = new MockFile(csvData, 'transactions.csv');
      
      const result = await parseCSV(file as unknown as File);
      
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('credit');
      expect(result[1].type).toBe('debit');
    });
  });
}); 