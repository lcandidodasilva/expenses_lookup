'use client';

import { useState } from 'react';
import { parseCSV } from '@/utils/csvParser';

interface UploadTransactionsProps {
  onUploadComplete: () => void;
}

export default function UploadTransactions({ onUploadComplete }: UploadTransactionsProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const transactions = await parseCSV(file);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload transactions');
      }

      onUploadComplete();
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error uploading transactions:', error);
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
    </div>
  );
} 