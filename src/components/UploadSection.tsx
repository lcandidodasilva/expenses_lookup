'use client';

import FileUpload from './FileUpload';
import RecategorizeButton from './RecategorizeButton';
import { Transaction } from '@/types/transaction';

interface UploadSectionProps {
  onFileUpload: (file: File) => Promise<void>;
  onClearTransactions: () => Promise<void>;
  onRecategorize: (month?: string) => Promise<void>;
  hasTransactions: boolean;
  isLoading: boolean;
  transactions: Transaction[];
}

export default function UploadSection({
  onFileUpload,
  onClearTransactions,
  onRecategorize,
  hasTransactions,
  isLoading,
  transactions
}: UploadSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-grow">
          <FileUpload onFileUpload={onFileUpload} />
        </div>
        {hasTransactions && (
          <div className="flex flex-col sm:flex-row gap-2">
            <RecategorizeButton 
              onRecategorize={onRecategorize} 
              transactions={transactions}
            />
            <button
              onClick={onClearTransactions}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              disabled={isLoading}
            >
              Clear All Transactions
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 