import { Transaction } from '../mocks/types';
import { findSalaryDates, generateMonthlyPeriods, filterTransactionsByPeriod, MonthlyPeriod } from '@/utils/dateUtils';
import { addDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

describe('dateUtils', () => {
  describe('findSalaryDates', () => {
    it('should find transactions that match salary criteria', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          date: new Date('2023-01-21'),
          description: 'EBAY MARKETPLACES GMBH SALARY',
          amount: 2000,
          type: 'credit',
          account: 'Checking',
          mainCategory: 'Income',
          subCategory: 'Salary',
          counterparty: 'EBAY MARKETPLACES',
          notes: null,
        },
        {
          id: '2',
          date: new Date('2023-02-22'),
          description: 'CONNEXIE SALARY',
          amount: 2000,
          type: 'credit',
          account: 'Checking',
          mainCategory: 'Income',
          subCategory: 'Salary',
          counterparty: 'CONNEXIE',
          notes: null,
        },
        {
          id: '3',
          date: new Date('2023-03-15'),
          description: 'GROCERY STORE',
          amount: 50,
          type: 'debit',
          account: 'Checking',
          mainCategory: 'FoodAndGroceries',
          subCategory: 'Groceries',
          counterparty: 'GROCERY STORE',
          notes: null,
        },
      ];

      const result = findSalaryDates(transactions);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(new Date('2023-01-21'));
      expect(result[1]).toEqual(new Date('2023-02-22'));
    });

    it('should return empty array when no salary transactions are found', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          date: new Date('2023-01-15'),
          description: 'GROCERY STORE',
          amount: 50,
          type: 'debit',
          account: 'Checking',
          mainCategory: 'FoodAndGroceries',
          subCategory: 'Groceries',
          counterparty: 'GROCERY STORE',
          notes: null,
        },
      ];

      const result = findSalaryDates(transactions);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('generateMonthlyPeriods', () => {
    it('should generate monthly periods from transactions', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          date: new Date('2023-01-15'),
          description: 'Transaction 1',
          amount: 100,
          type: 'debit',
          account: 'Checking',
          mainCategory: 'Housing',
          subCategory: 'Rent',
          counterparty: 'LANDLORD',
          notes: null,
        },
        {
          id: '2',
          date: new Date('2023-03-20'),
          description: 'Transaction 2',
          amount: 200,
          type: 'debit',
          account: 'Checking',
          mainCategory: 'Transportation',
          subCategory: 'Fuel',
          counterparty: 'GAS STATION',
          notes: null,
        },
      ];

      const result = generateMonthlyPeriods(transactions);
      
      expect(result).toHaveLength(3); // Jan, Feb, Mar
      expect(result[0].label).toBe('Jan 2023');
      expect(result[1].label).toBe('Feb 2023');
      expect(result[2].label).toBe('Mar 2023');
    });

    it('should return empty array for empty transactions', () => {
      const result = generateMonthlyPeriods([]);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('filterTransactionsByPeriod', () => {
    it('should filter transactions within the given period', () => {
      const now = new Date();
      const thisMonth = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      
      const period: MonthlyPeriod = {
        start: startOfDay(thisMonth),
        end: endOfDay(monthEnd),
        label: 'Current Month',
      };
      
      const withinPeriod = addDays(thisMonth, 10);
      const outsidePeriod = addDays(monthEnd, 10);
      
      const transactions: Transaction[] = [
        {
          id: '1',
          date: withinPeriod,
          description: 'Transaction Within Period',
          amount: 100,
          type: 'debit',
          account: 'Checking',
          mainCategory: 'Housing',
          subCategory: 'Rent',
          counterparty: 'LANDLORD',
          notes: null,
        },
        {
          id: '2',
          date: outsidePeriod,
          description: 'Transaction Outside Period',
          amount: 200,
          type: 'debit',
          account: 'Checking',
          mainCategory: 'Transportation',
          subCategory: 'Fuel',
          counterparty: 'GAS STATION',
          notes: null,
        },
      ];

      const result = filterTransactionsByPeriod(transactions, period);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].description).toBe('Transaction Within Period');
    });
  });
}); 