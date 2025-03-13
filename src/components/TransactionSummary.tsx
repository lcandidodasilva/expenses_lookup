'use client';

import { useState, useEffect } from 'react';
import { Transaction, CategoryName, CATEGORY_COLORS } from '@/types/transaction';
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

export default function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    categoryTotals: {} as Record<CategoryName, number>,
  });

  useEffect(() => {
    const calculateSummary = () => {
      const totals = transactions.reduce(
        (acc, transaction) => {
          if (transaction.type === 'credit') {
            acc.totalIncome += transaction.amount;
          } else {
            acc.totalExpenses += transaction.amount;
          }
          acc.categoryTotals[transaction.category] = (acc.categoryTotals[transaction.category] || 0) + transaction.amount;
          return acc;
        },
        { totalIncome: 0, totalExpenses: 0, categoryTotals: {} as Record<CategoryName, number> }
      );

      setSummary(totals);
    };

    calculateSummary();
  }, [transactions]);

  const pieData = {
    labels: Object.keys(summary.categoryTotals),
    datasets: [
      {
        data: Object.values(summary.categoryTotals),
        backgroundColor: Object.keys(summary.categoryTotals).map(
          (category) => CATEGORY_COLORS[category as CategoryName]
        ),
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Income:</span>
            <span className="text-green-600 font-semibold">
              €{summary.totalIncome.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Expenses:</span>
            <span className="text-red-600 font-semibold">
              €{summary.totalExpenses.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-gray-600 font-semibold">Net Balance:</span>
            <span className={`font-semibold ${
              summary.totalIncome - summary.totalExpenses >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              €{(summary.totalIncome - summary.totalExpenses).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Expenses by Category</h2>
        <div className="h-64">
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>
    </div>
  );
} 