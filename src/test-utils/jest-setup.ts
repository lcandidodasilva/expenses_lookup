// Jest setup file for common mocks and helper functions

// Mock for transactions type
export interface MockTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  account: string;
  mainCategory: string;
  subCategory: string;
  counterparty: string | null;
  notes: string | null;
}

// Mock for the Prisma client
export const mockPrismaClient = {
  transaction: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  categoryPattern: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock for the dateUtils functions
export const mockDateUtils = {
  findSalaryDates: jest.fn(),
  generateMonthlyPeriods: jest.fn(),
  filterTransactionsByPeriod: jest.fn(),
};

// Mock for the geminiCategorizer
export const mockGeminiCategorizer = {
  categorizeWithGemini: jest.fn().mockResolvedValue({
    mainCategory: 'Housing',
    subCategory: 'Rent',
  }),
};

// Mock for csvParser
export const mockCsvParser = {
  parseCSV: jest.fn(),
};

// Reset all mocks helper function
export const resetAllMocks = () => {
  jest.clearAllMocks();
  Object.values(mockPrismaClient.transaction).forEach(mock => mock.mockReset());
  Object.values(mockPrismaClient.categoryPattern).forEach(mock => mock.mockReset());
  Object.values(mockDateUtils).forEach(mock => mock.mockReset());
  mockGeminiCategorizer.categorizeWithGemini.mockReset();
  mockCsvParser.parseCSV.mockReset();
};



