'use client';

import { Transaction } from '@/types/transaction';
import TransactionSummary from './TransactionSummary';
import TransactionList from './TransactionList';
import CategoryCards from './CategoryCards';

interface TransactionDashboardProps {
  transactions: Transaction[];
  onCategoryUpdate: (transactionId: string, categoryName: string) => Promise<void>;
}

export default function TransactionDashboard({
  transactions,
  onCategoryUpdate
}: TransactionDashboardProps) {
  if (transactions.length === 0) return null;
  
  return (
    <>
      <div className="mb-8">
        <TransactionSummary transactions={transactions} />
      </div>

      <div className="mb-8">
        <CategoryCards transactions={transactions} />
      </div>

      <div>
        <TransactionList 
          transactions={transactions}
          onCategoryUpdate={onCategoryUpdate}
        />
      </div>
    </>
  );
} 