import { Transaction } from '../mocks/types';
import { saveTransactions, updateTransactionCategory, getTransactionsByPeriod } from '@/utils/db';
import prisma from '@/utils/db';

// Mock the Prisma client
jest.mock('@/utils/db', () => ({
  __esModule: true,
  default: {
    transaction: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
  saveTransactions: jest.requireActual('@/utils/db').saveTransactions,
  updateTransactionCategory: jest.requireActual('@/utils/db').updateTransactionCategory,
  getTransactionsByPeriod: jest.requireActual('@/utils/db').getTransactionsByPeriod,
  // Mock other exported functions
  validateTransaction: jest.fn(),
  convertToDatabaseCategories: jest.fn().mockImplementation((main, sub) => ({ mainCategory: main, subCategory: sub })),
  convertToAppCategories: jest.fn().mockImplementation((main, sub) => ({ mainCategory: main, subCategory: sub })),
}));

describe('db utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTransactions', () => {
    it('should save transactions to the database and return saved transactions', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: new Date('2023-01-15'),
          description: 'Test Transaction',
          amount: 100,
          type: 'debit',
          account: 'Checking',
          mainCategory: 'Housing',
          subCategory: 'Rent',
          counterparty: 'LANDLORD',
          notes: null,
        },
      ];

      // Mock the create method to return a transaction
      const mockCreate = prisma.transaction.create as jest.Mock;
      mockCreate.mockResolvedValueOnce({
        ...mockTransactions[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await saveTransactions(mockTransactions);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].description).toBe('Test Transaction');
    });
  });

  describe('updateTransactionCategory', () => {
    it('should update transaction category', async () => {
      const transactionId = '1';
      const mainCategory = 'Housing';
      const subCategory = 'Rent';

      const mockUpdate = prisma.transaction.update as jest.Mock;
      mockUpdate.mockResolvedValueOnce({
        id: transactionId,
        mainCategory,
        subCategory,
      });

      await updateTransactionCategory(transactionId, mainCategory, subCategory);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: {
          mainCategory,
          subCategory,
        },
      });
    });
  });

  describe('getTransactionsByPeriod', () => {
    it('should return transactions within the specified period', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const mockTransactions = [
        {
          id: '1',
          date: new Date('2023-01-15'),
          description: 'Transaction Within Period',
          amount: 100,
          type: 'debit',
          account: 'Checking',
          mainCategory: 'Housing',
          subCategory: 'Rent',
          counterparty: 'LANDLORD',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFindMany = prisma.transaction.findMany as jest.Mock;
      mockFindMany.mockResolvedValueOnce(mockTransactions);

      const result = await getTransactionsByPeriod(startDate, endDate);

      expect(mockFindMany).toHaveBeenCalledTimes(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].description).toBe('Transaction Within Period');
    });
  });
}); 