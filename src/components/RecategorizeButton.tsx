'use client';

import { useState } from 'react';
import { Transaction } from '@/types/transaction';
import { format } from 'date-fns';

interface RecategorizeButtonProps {
  onRecategorize: (month?: string) => Promise<void>;
  transactions: Transaction[];
}

export default function RecategorizeButton({ onRecategorize, transactions }: RecategorizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Generate a list of available months from transactions
  const availableMonths = getAvailableMonths(transactions);

  const handleClick = async () => {
    if (isLoading) return;
    
    const confirmed = window.confirm(
      selectedMonth 
        ? `This will recategorize transactions marked as 'Other' for ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}. Continue?`
        : "This will recategorize ALL transactions marked as 'Other'. This may take a while. Continue?"
    );
    
    if (!confirmed) return;
    
    setIsLoading(true);
    try {
      await onRecategorize(selectedMonth || undefined);
      alert('Recategorization completed successfully!');
    } catch (error) {
      console.error('Error during recategorization:', error);
      alert('Failed to recategorize transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
      <select
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      >
        <option value="">All Transactions</option>
        {availableMonths.map((month) => (
          <option key={month} value={month}>
            {format(new Date(month + '-01'), 'MMMM yyyy')}
          </option>
        ))}
      </select>
      
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Recategorizing...' : 'Recategorize "Other" Transactions'}
      </button>
    </div>
  );
}

// Helper function to get available months from transactions
function getAvailableMonths(transactions: Transaction[]): string[] {
  const months = new Set<string>();
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.add(monthKey);
  });
  
  return Array.from(months).sort().reverse(); // Most recent months first
} 