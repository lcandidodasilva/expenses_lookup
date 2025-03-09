'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionCategory } from '@/types/transaction';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  onCategoryUpdate: (transactionId: string, categoryName: string) => Promise<void>;
}

export default function TransactionList({ transactions, onCategoryUpdate }: TransactionListProps) {
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch categories when component mounts
    fetch('/api/categories')
      .then(response => response.json())
      .then(data => setCategories(data))
      .catch(error => console.error('Error fetching categories:', error));
  }, []);

  const handleCategoryChange = async (transactionId: string, categoryName: string) => {
    try {
      await onCategoryUpdate(transactionId, categoryName);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating category:', error);
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
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(transaction.date, 'MMM dd, yyyy')}
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
                    >
                      {categories.map((category) => (
                        <option key={category.name} value={category.name}>
                          {category.name}
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