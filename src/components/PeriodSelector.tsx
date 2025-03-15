'use client';

import { MonthlyPeriod } from '@/utils/dateUtils';

interface PeriodSelectorProps {
  periods: MonthlyPeriod[];
  selectedPeriod: MonthlyPeriod | null;
  onPeriodChange: (period: MonthlyPeriod) => void;
}

export default function PeriodSelector({ 
  periods, 
  selectedPeriod, 
  onPeriodChange 
}: PeriodSelectorProps) {
  if (periods.length === 0) return null;
  
  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Period
      </label>
      <select
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        value={periods.findIndex(p => p === selectedPeriod)}
        onChange={(e) => onPeriodChange(periods[parseInt(e.target.value)])}
      >
        {periods.map((period, index) => (
          <option key={period.label} value={index}>
            {period.label}
          </option>
        ))}
      </select>
    </div>
  );
} 