'use client';

import { Transaction, MainCategory, CATEGORY_COLORS } from '@/types/transaction';
import { useMemo } from 'react';

interface CategoryCardsProps {
  transactions: Transaction[];
}

export default function CategoryCards({ transactions }: CategoryCardsProps) {
  const categoryTotals = useMemo(() => {
    const totals: Record<MainCategory, number> = {} as Record<MainCategory, number>;
    
    transactions.forEach(transaction => {
      const mainCategory = transaction.mainCategory as MainCategory;
      const amount = transaction.amount;
      
      if (!totals[mainCategory]) {
        totals[mainCategory] = 0;
      }
      
      if (transaction.type === 'debit') {
        totals[mainCategory] += amount;
      }
    });
    
    // Sort categories by total amount (descending)
    return Object.entries(totals)
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category: category as MainCategory,
        amount
      }));
  }, [transactions]);
  
  if (categoryTotals.length === 0) return null;
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Category Spending</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categoryTotals.map(({ category, amount }) => (
          <div 
            key={category}
            className="bg-white rounded-lg shadow p-4 border-l-4"
            style={{ borderLeftColor: CATEGORY_COLORS[category] }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: CATEGORY_COLORS[category] }}
                />
                <h3 className="font-medium">{category.replace(/([A-Z])/g, ' $1').trim()}</h3>
              </div>
              <span className="text-lg font-bold">€{amount.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 