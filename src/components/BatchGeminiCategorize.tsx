import React, { useState } from 'react';
import { Transaction } from '@/types/transaction';

interface BatchGeminiCategorizeProps {
  transactions: Transaction[];
  onCategorize: () => void;
}

export default function BatchGeminiCategorize({ transactions, onCategorize }: BatchGeminiCategorizeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const handleClick = async () => {
    // Filter transactions with category 'Other'
    const uncategorizedTransactions = transactions.filter(t => 
      t.mainCategory === 'Miscellaneous' && t.subCategory === 'Other'
    );
    
    if (uncategorizedTransactions.length === 0) {
      alert('No uncategorized transactions found.');
      return;
    }
    
    if (!confirm(`This will categorize ${uncategorizedTransactions.length} transactions using Gemini AI. Continue?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      setTotal(uncategorizedTransactions.length);
      setProgress(0);
      
      const transactionIds = uncategorizedTransactions.map(t => t.id);
      
      const response = await fetch('/api/transactions/categorize-with-gemini', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to categorize transactions');
      }

      const data = await response.json();
      
      // Call the onCategorize callback to refresh the UI
      onCategorize();
      
      alert(`Successfully categorized ${data.successfullyRecategorized} out of ${data.totalProcessed} transactions.`);
    } catch (error) {
      console.error('Error batch categorizing transactions:', error);
      alert('Failed to categorize transactions. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="mb-4">
      <button 
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? `Categorizing... (${progress}/${total})` : 'Batch Categorize with Gemini'}
      </button>
      {isLoading && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${(progress / total) * 100}%` }}
          ></div>
        </div>
      )}
    </div>
  );
} 