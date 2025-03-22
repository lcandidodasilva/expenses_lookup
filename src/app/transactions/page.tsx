'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';
import { parseCSV } from '@/utils/csvParser';
import { MonthlyPeriod, generateMonthlyPeriods, filterTransactionsByPeriod } from '@/utils/dateUtils';
import PeriodSelector from '@/components/PeriodSelector';
import TransactionList from '@/components/TransactionList';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [periods, setPeriods] = useState<MonthlyPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<MonthlyPeriod | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    // Load initial data
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/transactions');
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data.transactions);
        setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : null);
        
        if (data.transactions.length > 0) {
          const newPeriods = generateMonthlyPeriods(data.transactions);
          setPeriods(newPeriods);
          setSelectedPeriod(newPeriods[newPeriods.length - 1]);

          // Extract unique years from transactions
          const uniqueYears = Array.from(new Set(data.transactions.map((t: Transaction) => new Date(t.date).getFullYear()))) as number[];
          setYears(uniqueYears);
          setSelectedYear(uniqueYears[0] || null);

          // Set default months
          setMonths(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);
          setSelectedMonth('January');
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear !== null && selectedMonth !== null) {
      const filtered = transactions.filter((transaction) => {
        const date = new Date(transaction.date);
        return date.getFullYear() === selectedYear && date.toLocaleString('default', { month: 'long' }) === selectedMonth;
      });
      setFilteredTransactions(filtered);
    }
  }, [selectedYear, selectedMonth, transactions]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const parsedTransactions = await parseCSV(file);
      
      // Save transactions to database
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: parsedTransactions }),
      });

      if (!response.ok) {
        throw new Error('Failed to save transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : null);
      
      if (data.transactions.length > 0) {
        const newPeriods = generateMonthlyPeriods(data.transactions);
        setPeriods(newPeriods);
        setSelectedPeriod(newPeriods[newPeriods.length - 1]);
      }

      // Show notification about duplicates
      const duplicatesCount = parsedTransactions.length - data.savedTransactionsCount;
      if (duplicatesCount > 0) {
        alert(`${data.savedTransactionsCount} new transactions imported. ${duplicatesCount} duplicate transactions were skipped.`);
      } else {
        alert(`${data.savedTransactionsCount} new transactions imported successfully.`);
      }
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error processing transactions:', error);
      alert('Error processing transactions. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryUpdate = async (transactionId: string, categoryName: string) => {
    try {
      const response = await fetch('/api/transactions/recategorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, categoryName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      // Refresh transactions for the current period
      if (selectedPeriod) {
        const response = await fetch(`/api/transactions?start=${selectedPeriod.start.toISOString()}&end=${selectedPeriod.end.toISOString()}`);
        const data = await response.json();
        setTransactions(data.transactions);
        setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : null);
        setFilteredTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please try again.');
    }
  };

  const handlePeriodChange = (period: MonthlyPeriod) => {
    setSelectedPeriod(period);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <div className="relative">
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          >
            Upload Transactions
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <select
          value={selectedYear || ''}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 rounded-md p-2"
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <select
          value={selectedMonth || ''}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded-md p-2"
        >
          {months.map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
      
      {isLoading && transactions.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {transactions.length > 0 && (
        <>
          <div className="mb-6">
            <PeriodSelector 
              periods={periods}
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            selectedPeriod && (
              <TransactionList 
                transactions={filteredTransactions}
                onCategoryUpdate={handleCategoryUpdate}
              />
            )
          )}
        </>
      )}
      
      {!isLoading && transactions.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
          <p className="text-gray-600">Upload a CSV file to get started</p>
        </div>
      )}
    </div>
  );
} 