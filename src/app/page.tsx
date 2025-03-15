'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';
import { parseCSV } from '@/utils/csvParser';
import { MonthlyPeriod, generateMonthlyPeriods, filterTransactionsByPeriod } from '@/utils/dateUtils';

// Import modular components
import Header from '@/components/Header';
import UploadSection from '@/components/UploadSection';
import PeriodSelector from '@/components/PeriodSelector';
import TransactionDashboard from '@/components/TransactionDashboard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [periods, setPeriods] = useState<MonthlyPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<MonthlyPeriod | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Load initial data
    const loadInitialData = async () => {
      try {
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

      const data = await response.json();
      setTransactions(data.transactions);
      setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : null);
      
      if (data.transactions.length > 0) {
        const newPeriods = generateMonthlyPeriods(data.transactions);
        setPeriods(newPeriods);
        setSelectedPeriod(newPeriods[newPeriods.length - 1]);
      }

      // Show notification about duplicates
      const duplicatesCount = parsedTransactions.length - data.newTransactionsCount;
      if (duplicatesCount > 0) {
        alert(`${data.newTransactionsCount} new transactions imported. ${duplicatesCount} duplicate transactions were skipped.`);
      } else {
        alert(`${data.newTransactionsCount} new transactions imported successfully.`);
      }
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

  const handleClearTransactions = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL transactions? This action cannot be undone."
    );
    
    if (!confirmed) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/transactions/clear', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear transactions');
      }
      
      const result = await response.json();
      alert(`Successfully cleared ${result.deletedCount} transactions.`);
      
      // Reset state
      setTransactions([]);
      setFilteredTransactions([]);
      setPeriods([]);
      setSelectedPeriod(null);
      setLastUpdated(null);
    } catch (error) {
      console.error('Error clearing transactions:', error);
      alert('Failed to clear transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecategorize = async (month?: string) => {
    try {
      setIsLoading(true);
      
      const url = month 
        ? `/api/transactions/recategorize?month=${month}`
        : '/api/transactions/recategorize';
      
      const response = await fetch(url, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to recategorize transactions');
      }
      
      const result = await response.json();
      
      // Refresh transactions
      const refreshResponse = await fetch('/api/transactions');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setTransactions(data.transactions);
        setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : null);
        
        if (data.transactions.length > 0 && selectedPeriod) {
          const filtered = filterTransactionsByPeriod(data.transactions, selectedPeriod);
          setFilteredTransactions(filtered);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error recategorizing transactions:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (period: MonthlyPeriod) => {
    setSelectedPeriod(period);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <Header lastUpdated={lastUpdated} />
        
        <UploadSection 
          onFileUpload={handleFileUpload}
          onClearTransactions={handleClearTransactions}
          onRecategorize={handleRecategorize}
          hasTransactions={transactions.length > 0}
          isLoading={isLoading}
          transactions={transactions}
        />

        {isLoading && <LoadingState />}

        {!isLoading && transactions.length > 0 && (
          <>
            <PeriodSelector 
              periods={periods}
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />

            {selectedPeriod && (
              <TransactionDashboard 
                transactions={filteredTransactions}
                onCategoryUpdate={handleCategoryUpdate}
              />
            )}
          </>
        )}

        {!isLoading && transactions.length === 0 && <EmptyState />}
      </div>
    </main>
  );
}
