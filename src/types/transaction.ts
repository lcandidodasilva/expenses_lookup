export type TransactionType = 'credit' | 'debit';

export type CategoryName = 
  | 'Income'
  | 'Housing'
  | 'Transportation'
  | 'Savings'
  | 'Utilities'
  | 'Insurance'
  | 'Healthcare'
  | 'Entertainment'
  | 'Shopping'
  | 'Delivery'
  | 'Supermarket'
  | 'Restaurants'
  | 'HouseImprovements'
  | 'Education'
  | 'Other';

export const DEFAULT_CATEGORIES: CategoryName[] = [
  'Income',
  'Housing',
  'Transportation',
  'Savings',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Delivery',
  'Supermarket',
  'Restaurants',
  'HouseImprovements',
  'Education',
  'Other'
];

export const CATEGORY_COLORS: Record<CategoryName, string> = {
  'Income': '#4CAF50',      // Green
  'Housing': '#2196F3',     // Blue
  'Transportation': '#FF9800', // Orange
  'Savings': '#9C27B0',     // Purple
  'Utilities': '#00BCD4',   // Cyan
  'Insurance': '#E91E63',   // Pink
  'Healthcare': '#F44336',  // Red
  'Entertainment': '#FF5722', // Deep Orange
  'Shopping': '#795548',    // Brown
  'Delivery': '#607D8B',    // Blue Grey
  'Supermarket': '#8BC34A', // Light Green
  'Restaurants': '#FFC107', // Amber
  'HouseImprovements': '#3F51B5', // Indigo
  'Education': '#009688',   // Teal
  'Other': '#9E9E9E'        // Grey
};

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  category: CategoryName;
  account: string;
  counterparty: string | null;
  notes: string | null;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryTotals: Record<CategoryName, number>;
} 