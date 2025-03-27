'use client';

import { useState } from 'react';
import { parseCSV } from '@/utils/csvParser';
import { Transaction } from '@/types/transaction';

interface UploadTransactionsProps {
  onUploadComplete: () => void;
}

export default function UploadTransactions({ onUploadComplete }: UploadTransactionsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Parse the CSV file into transactions
      const transactions: Transaction[] = await parseCSV(file);
      
      if (!transactions.length) {
        setError('No valid transactions found in the CSV file');
        setIsUploading(false);
        return;
      }
      
      console.log(`Sending ${transactions.length} transactions to the API`);

      // Send the transactions directly without wrapping them in an object
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactions),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload transactions');
      }

      const data = await response.json();
      console.log(`Successfully saved ${data.newTransactionsCount} new transactions`);
      
      onUploadComplete();
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error uploading transactions:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label
        htmlFor="file-upload"
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Transactions'}
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="sr-only"
        />
      </label>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 