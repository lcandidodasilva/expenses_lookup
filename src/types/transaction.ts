export const DEFAULT_CATEGORIES = [
  'Housing',
  'Transportation',
  'Savings',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Income',
  'Supermarket',
  'Delivery',
  'Other'
] as const;

export type CategoryName = typeof DEFAULT_CATEGORIES[number];

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: CategoryName;
  account: string;
  counterparty?: string;
  notes?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryTotals: Record<CategoryName, number>;
} 