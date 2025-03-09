export type TransactionCategory =
  | 'Housing'
  | 'Transportation'
  | 'Savings'
  | 'Utilities'
  | 'Insurance'
  | 'Healthcare'
  | 'Entertainment'
  | 'Shopping'
  | 'Income'
  | 'Supermarket'
  | 'Delivery'
  | 'Other';

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: TransactionCategory;
  account: string;
  counterparty: string;
  transactionType: string;
  notes?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryTotals: Record<TransactionCategory, number>;
} 