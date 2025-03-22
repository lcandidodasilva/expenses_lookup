'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types/transaction';
import TransactionSummary from '@/components/TransactionSummary';
import CategoryCards from '@/components/CategoryCards';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/transactions');
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data.transactions);

        // Extract unique years from transactions
        const uniqueYears = Array.from(new Set(data.transactions.map((t: Transaction) => new Date(t.date).getFullYear()))) as number[];
        setYears(uniqueYears);
        setSelectedYear(uniqueYears[0] || null);

        // Set default months
        setMonths(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);
        setSelectedMonth('January');
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
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
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <TransactionSummary transactions={filteredTransactions} />
          <CategoryCards transactions={filteredTransactions} />
        </>
      )}
      
      {!isLoading && filteredTransactions.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions for this period</h3>
          <p className="text-gray-600">
            Go to the <a href="/transactions" className="text-blue-600 underline">Transactions</a> page to upload your transactions
          </p>
        </div>
      )}
    </div>
  );
}
