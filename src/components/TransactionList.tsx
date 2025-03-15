'use client';

import { useState, useEffect } from 'react';
import { Transaction, DEFAULT_CATEGORIES, CATEGORY_COLORS } from '@/types/transaction';
import { format, parseISO, startOfDay, endOfDay, parse } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  onCategoryUpdate: (transactionId: string, categoryName: string) => Promise<void>;
}

type SortField = 'date' | 'description' | 'category' | 'amount';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function TransactionList({ transactions, onCategoryUpdate }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [filters, setFilters] = useState<Partial<Record<keyof Transaction, string>>>({});
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);

  useEffect(() => {
    let result = [...transactions];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(transaction => {
          const fieldValue = transaction[key as keyof Transaction];
          if (typeof fieldValue === 'string') {
            return fieldValue.toLowerCase().includes(value.toLowerCase());
          }
          if (key === 'date') {
            // Handle date filtering with dd/MM/yyyy format
            try {
              // Parse the filter date from yyyy-MM-dd (HTML input format) to a Date object
              const filterDate = new Date(value);
              // Parse the transaction date to a Date object
              const transactionDate = new Date(transaction.date);
              
              // Format both dates to dd/MM/yyyy for string comparison
              const filterDateFormatted = format(filterDate, 'dd/MM/yyyy');
              const transactionDateFormatted = format(transactionDate, 'dd/MM/yyyy');
              
              // Compare the formatted dates
              return filterDateFormatted === transactionDateFormatted;
            } catch (e) {
              console.error('Error parsing date:', e);
              return false;
            }
          }
          if (typeof fieldValue === 'number') {
            return fieldValue.toString().includes(value);
          }
          return false;
        });
      }
    });

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (sortConfig.field === 'date') {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        return sortConfig.direction === 'asc' 
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      }

      if (typeof aValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - (bValue as number)
          : (bValue as number) - aValue;
      }

      return 0;
    });

    setFilteredTransactions(result);
  }, [transactions, sortConfig, filters]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilter = (field: keyof Transaction, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = async (transactionId: string, categoryName: string) => {
    try {
      setLoading(true);
      await onCategoryUpdate(transactionId, categoryName);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setLoading(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1">
      {sortConfig.field === field && (
        sortConfig.direction === 'asc' ? '↑' : '↓'
      )}
    </span>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}>
                Date <SortIcon field="date" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('description')}>
                Description <SortIcon field="description" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}>
                Category <SortIcon field="category" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}>
                Amount <SortIcon field="amount" />
              </th>
            </tr>
            <tr>
              <th className="px-6 py-2">
                <input
                  type="date"
                  className="w-full px-2 py-1 text-sm border rounded"
                  onChange={(e) => handleFilter('date', e.target.value)}
                />
              </th>
              <th className="px-6 py-2">
                <input
                  type="text"
                  placeholder="Filter description..."
                  className="w-full px-2 py-1 text-sm border rounded"
                  onChange={(e) => handleFilter('description', e.target.value)}
                />
              </th>
              <th className="px-6 py-2">
                <select
                  className="w-full px-2 py-1 text-sm border rounded"
                  onChange={(e) => handleFilter('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {DEFAULT_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </th>
              <th className="px-6 py-2">
                <input
                  type="number"
                  placeholder="Filter amount..."
                  className="w-full px-2 py-1 text-sm border rounded"
                  onChange={(e) => handleFilter('amount', e.target.value)}
                />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className={loading ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(transaction.date), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === transaction.id ? (
                    <select
                      className="block w-full px-2 py-1 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={transaction.category}
                      onChange={(e) => handleCategoryChange(transaction.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      disabled={loading}
                    >
                      {DEFAULT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="cursor-pointer hover:text-blue-600 inline-flex items-center"
                      onClick={() => setEditingId(transaction.id)}
                    >
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: CATEGORY_COLORS[transaction.category] }}
                      />
                      {transaction.category}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'credit' ? '+' : '-'}€{Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 