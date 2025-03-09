'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';
import { parseCSV } from '@/utils/csvParser';
import { MonthlyPeriod, generateMonthlyPeriods, filterTransactionsByPeriod } from '@/utils/dateUtils';
import TransactionList from '@/components/TransactionList';
import TransactionSummary from '@/components/TransactionSummary';
import FileUpload from '@/components/FileUpload';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [periods, setPeriods] = useState<MonthlyPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<MonthlyPeriod | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize categories when the app loads
    fetch('/api/categories', { method: 'PUT' })
      .catch(error => console.error('Error initializing categories:', error));
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      const newPeriods = generateMonthlyPeriods(transactions);
      setPeriods(newPeriods);
      setSelectedPeriod(newPeriods[newPeriods.length - 1]); // Select the most recent period
    }
  }, [transactions]);

  useEffect(() => {
    if (selectedPeriod && transactions.length > 0) {
      const filtered = filterTransactionsByPeriod(transactions, selectedPeriod);
      setFilteredTransactions(filtered);
    }
  }, [selectedPeriod, transactions]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      const parsedTransactions = await parseCSV(file);
      
      // Save transactions to database
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedTransactions),
      });

      if (!response.ok) {
        throw new Error('Failed to save transactions');
      }

      const savedTransactions = await response.json();
      setTransactions(savedTransactions);
    } catch (error) {
      console.error('Error processing transactions:', error);
      alert('Error processing transactions. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryUpdate = async (transactionId: string, categoryName: string) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, categoryName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      // Refresh transactions for the current period
      if (selectedPeriod) {
        const response = await fetch(`/api/transactions?start=${selectedPeriod.start.toISOString()}&end=${selectedPeriod.end.toISOString()}`);
        const updatedTransactions = await response.json();
        setFilteredTransactions(updatedTransactions);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please try again.');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Personal Finance Tracker</h1>
        
        <div className="mb-8">
          <FileUpload onFileUpload={handleFileUpload} />
        </div>

        {isLoading && (
          <div className="text-center text-gray-500 my-8">
            <p className="text-xl">Processing transactions...</p>
          </div>
        )}

        {!isLoading && transactions.length > 0 && (
          <>
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Period
              </label>
              <select
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={periods.findIndex(p => p === selectedPeriod)}
                onChange={(e) => setSelectedPeriod(periods[parseInt(e.target.value)])}
              >
                {periods.map((period, index) => (
                  <option key={period.label} value={index}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedPeriod && (
              <>
                <div className="mb-8">
                  <TransactionSummary transactions={filteredTransactions} />
                </div>

                <div>
                  <TransactionList 
                    transactions={filteredTransactions}
                    onCategoryUpdate={handleCategoryUpdate}
                  />
                </div>
              </>
            )}
          </>
        )}

        {!isLoading && transactions.length === 0 && (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-xl">Upload a CSV file to get started</p>
            <p className="mt-2">Your file should contain columns for date, description, and amount</p>
          </div>
        )}
      </div>
    </main>
  );
}
