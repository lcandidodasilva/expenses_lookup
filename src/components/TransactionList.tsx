'use client';

import { useState, useEffect } from 'react';
import { Transaction, DEFAULT_CATEGORIES } from '@/types/transaction';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  onCategoryUpdate: (transactionId: string, categoryName: string) => Promise<void>;
}

export default function TransactionList({ transactions, onCategoryUpdate }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className={loading ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => setEditingId(transaction.id)}
                    >
                      {transaction.category}
                    </span>
                  )}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}
                  ${Math.abs(transaction.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 