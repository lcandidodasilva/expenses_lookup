import React, { useState } from 'react';
import { Transaction } from '@/types/transaction';

interface GeminiCategorizeButtonProps {
  transaction: Transaction;
  onCategorize: (transactionId: string) => void;
}

export default function GeminiCategorizeButton({ transaction, onCategorize }: GeminiCategorizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/transactions/categorize-with-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          description: transaction.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to categorize transaction');
      }

      const data = await response.json();
      
      // Call the onCategorize callback to refresh the UI
      onCategorize(transaction.id);
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      alert('Failed to categorize transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? 'Categorizing...' : 'Categorize with Gemini'}
    </button>
  );
} 