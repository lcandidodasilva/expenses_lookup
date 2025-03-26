// Mock of transaction types for testing purposes
export type Transaction = {
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
}; 