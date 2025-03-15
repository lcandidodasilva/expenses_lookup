'use client';

import { format } from 'date-fns';

interface HeaderProps {
  lastUpdated: Date | null;
}

export default function Header({ lastUpdated }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold">Personal Finance Tracker</h1>
      {lastUpdated && (
        <p className="text-sm text-gray-500">
          Last updated: {format(lastUpdated, 'dd/MM/yyyy HH:mm')}
        </p>
      )}
    </div>
  );
} 