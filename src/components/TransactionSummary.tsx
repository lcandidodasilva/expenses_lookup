'use client';

import { useState, useEffect } from 'react';
import { Transaction, CategoryName } from '@/types/transaction';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

interface TransactionSummaryProps {
  transactions: Transaction[];
}

interface CategoryTotal {
  name: CategoryName;
  amount: number;
}

export default function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const totalIncome = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = Math.abs(
    transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const balance = totalIncome - totalExpenses;

  const categoryTotals = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'debit') {
      acc[transaction.category] = (acc[transaction.category] || 0) + Math.abs(transaction.amount);
    }
    return acc;
  }, {} as Record<CategoryName, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .map(([name, amount]) => ({ name: name as CategoryName, amount }))
    .sort((a, b) => b.amount - a.amount);

  const pieChartData = {
    labels: sortedCategories.map(c => c.name),
    datasets: [
      {
        data: sortedCategories.map(c => c.amount),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
        <div className="space-y-4">
          <div>
            <p className="text-gray-600">Total Income</p>
            <p className="text-2xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              ${totalExpenses.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Balance</p>
            <p className={`text-2xl font-bold ${
              balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Expense Categories</h2>
        {sortedCategories.length > 0 ? (
          <div className="h-64">
            <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No expense data available for this period
          </div>
        )}
      </div>

      {/* Category List */}
      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.map((category) => (
            <div key={category.name} className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-700">{category.name}</h3>
              <p className="text-xl font-bold text-red-600">${category.amount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                {((category.amount / totalExpenses) * 100).toFixed(1)}% of total expenses
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 